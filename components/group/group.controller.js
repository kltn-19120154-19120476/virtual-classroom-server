import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { sendEmail } from "../../config/email/emailService.js";
import { STATUS } from "../../constants/common.js";
import {
  BAD_REQUEST_STATUS_CODE,
  BAD_REQUEST_STATUS_MESSAGE,
  FORBIDDEN_STATUS_CODE,
  FORBIDDEN_STATUS_MESSAGE,
  INTERNAL_SERVER_STATUS_CODE,
  INTERNAL_SERVER_STATUS_MESSAGE,
  NOTFOUND_STATUS_CODE,
  NOTFOUND_STATUS_MESSAGE,
  SUCCESS_STATUS_CODE,
  SUCCESS_STATUS_MESSAGE,
} from "../../constants/http-response.js";

import { APIResponse } from "../../models/APIResponse.js";
import groupModel from "../../models/group.model.js";
import userModel from "../../models/user.model.js";
import dotenv from "dotenv";
dotenv.config();
// Interact Data

export const createGroup = async (req, res) => {
  const { name, token } = req.body;

  //Check name exists
  try {
    const existGroup = await groupModel.findOne({ name });
    if (existGroup) {
      return res.status(BAD_REQUEST_STATUS_CODE).json(APIResponse(STATUS.ERROR, "Your group name is already existed"));
    }
  } catch (error) {
    return res.status(INTERNAL_SERVER_STATUS_CODE).json(APIResponse(STATUS.ERROR, error.message));
  }

  //Get Owner
  const owner = jwt.decode(token);
  let ownerUser;

  try {
    ownerUser = await userModel.findOne({ email: owner.user.email });
  } catch (error) {
    return res.status(INTERNAL_SERVER_STATUS_CODE).json(APIResponse(STATUS.ERROR, error.message));
  }

  const newGroup = new groupModel({
    name,
    ownerId: ownerUser._id,
    memberIds: [],
    coOwnerIds: [],
    inviteCode: [],
  });

  //Add group to user
  ownerUser.myGroupIds.push(newGroup);
  try {
    await ownerUser.save();
    await newGroup.save();
  } catch (error) {
    return res.status(INTERNAL_SERVER_STATUS_CODE).json(APIResponse(STATUS.ERROR, error.message));
  }

  //ALl SUCCESS
  return res.status(SUCCESS_STATUS_CODE).json(APIResponse(STATUS.OK, newGroup));
};

export const createInviteLink = async (req, res) => {
  const { groupId, token } = req.body;

  let groupInstance;

  try {
    groupInstance = await groupModel.findById(groupId);
  } catch (error) {
    return res.status(INTERNAL_SERVER_STATUS_CODE).json(APIResponse(STATUS.ERROR, error.message));
  }

  // Get owner information
  const owner = jwt.decode(token);
  let ownerUser;

  try {
    ownerUser = await userModel.findOne({ email: owner.user.email });
  } catch (error) {
    return res.status(INTERNAL_SERVER_STATUS_CODE).json(APIResponse(STATUS.ERROR, error.message));
  }

  // Check if requester is group's owner
  if (!groupInstance?.ownerId.equals(ownerUser?._id)) {
    return res.status(FORBIDDEN_STATUS_CODE).json(APIResponse(STATUS.ERROR, "You are not allowed to do this", []));
  }

  const code = uuidv4();
  groupInstance.inviteCode.push(code);

  try {
    await groupInstance.save();
  } catch (error) {
    return res.status(INTERNAL_SERVER_STATUS_CODE).json(APIResponse(STATUS.ERROR, error.message));
  }

  //ALl SUCCESS
  return res.status(SUCCESS_STATUS_CODE).json(APIResponse(STATUS.OK, SUCCESS_STATUS_MESSAGE, { groupId: groupInstance._id, code }));
};

export const inviteByLink = async (req, res) => {
  const { code, groupId, userId } = req.body;

  //Get Member
  let memberUser;

  try {
    memberUser = await userModel.findById(userId);
  } catch (error) {
    return res.status(INTERNAL_SERVER_STATUS_CODE).json(APIResponse(STATUS.ERROR, error.message));
  }

  //Get GroupInstance
  let groupInstance;

  try {
    groupInstance = await groupModel.findById(groupId);
  } catch (error) {
    return res.status(INTERNAL_SERVER_STATUS_CODE).json(APIResponse(STATUS.ERROR, error.message));
  }

  //Check user already in group
  if (groupInstance.ownerId.equals(userId) || groupInstance.coOwnerIds.includes(userId) || groupInstance.memberIds.includes(userId)) {
    return res.status(BAD_REQUEST_STATUS_CODE).json(APIResponse(STATUS.ERROR, BAD_REQUEST_STATUS_MESSAGE, "You are already in this group !!!"));
  }

  //Check code
  if (!groupInstance.inviteCode.includes(code)) {
    return res.status(FORBIDDEN_STATUS_CODE).json(APIResponse(STATUS.ERROR, "You are not invited", []));
  }

  //Remove inviteCode and add to member
  var index = groupInstance.inviteCode.indexOf(code);
  if (index > -1) {
    groupInstance.inviteCode.splice(index, 1);
  }

  groupInstance.memberIds.push(memberUser);
  memberUser.joinedGroupIds.push(groupInstance);

  try {
    await groupInstance.save();
    await memberUser.save();
  } catch (error) {
    return res.status(INTERNAL_SERVER_STATUS_CODE).json(APIResponse(STATUS.ERROR, error.message));
  }

  return res.status(SUCCESS_STATUS_CODE).json(APIResponse(STATUS.OK, "Add successfully"));
};

export const sendEmailInvite = async (req, res) => {
  const { link, email, ownerName } = req.body;

  try {
    sendEmail(process.env.EMAIL_HOST, email,
      "Invited to a group",
      `<p> ${ownerName ? ownerName : 'Someone'} has invited you to a group, click to join: <a href="${link}"> ${link} </a></p>`)
  } catch (error) {
    return res.status(INTERNAL_SERVER_STATUS_CODE).json(APIResponse(STATUS.ERROR, error.message));
  }

  return res.status(SUCCESS_STATUS_CODE).json(APIResponse(STATUS.OK, SUCCESS_STATUS_MESSAGE, 'Send invited link successully !!!'))
}

export const upgradeRole = async (req, res) => {
  const { memberId, roleCode, groupId, token, isUpgrade } = req.body;

  // Get owner information
  const owner = jwt.decode(token);
  let ownerUser;

  try {
    ownerUser = await userModel.findOne({ email: owner.user.email });
  } catch (error) {
    return res.status(INTERNAL_SERVER_STATUS_CODE).json(APIResponse(STATUS.ERROR, error.message));
  }

  // Get member information
  let memberUser;

  try {
    memberUser = await userModel.findById(memberId);
  } catch (error) {
    return res.status(INTERNAL_SERVER_STATUS_CODE).json(APIResponse(STATUS.ERROR, error.message));
  }

  //Get GroupInstance
  let groupInstance;

  try {
    groupInstance = await groupModel.findById(groupId);
  } catch (error) {
    return res.status(INTERNAL_SERVER_STATUS_CODE).json(APIResponse(STATUS.ERROR, error.message));
  }

  //Check if requester is group's owner
  if (!groupInstance.ownerId.equals(ownerUser._id)) {
    return res.status(FORBIDDEN_STATUS_CODE).json(APIResponse(STATUS.ERROR, "You are not allowed to do this"));
  }

  if (isUpgrade) {
    //Move from member to co-owner
    var index = groupInstance.memberIds.indexOf(memberUser._id);
    if (index > -1) {
      groupInstance.memberIds.splice(index, 1);
    }

    groupInstance.coOwnerIds.push(memberUser);

    try {
      await groupInstance.save();
    } catch (error) {
      return res.status(INTERNAL_SERVER_STATUS_CODE).json(APIResponse(STATUS.ERROR, error.message));
    }

    return res.status(SUCCESS_STATUS_CODE).json(APIResponse(STATUS.OK, SUCCESS_STATUS_MESSAGE, "Upgrade role successfully"));
  } else {
    //Move from co-owner to member
    var index = groupInstance.coOwnerIds.indexOf(memberUser._id);
    if (index > -1) {
      groupInstance.coOwnerIds.splice(index, 1);
    }

    groupInstance.memberIds.push(memberUser);

    try {
      await groupInstance.save();
    } catch (error) {
      return res.status(INTERNAL_SERVER_STATUS_CODE).json(APIResponse(STATUS.ERROR, error.message));
    }

    return res.status(SUCCESS_STATUS_CODE).json(APIResponse(STATUS.OK, SUCCESS_STATUS_MESSAGE, "Downgrade role successfully"));
  }
};

export const removeMember = async (req, res) => {
  const { groupId, userId } = req.body;

  // //Get Member
  let memberUser;

  try {
    memberUser = await userModel.findById(userId);
  } catch (error) {
    return res.status(INTERNAL_SERVER_STATUS_CODE).json(APIResponse(STATUS.ERROR, error.message));
  }

  //Get GroupInstance
  let groupInstance;

  try {
    groupInstance = await groupModel.findById(groupId);
  } catch (error) {
    return res.status(INTERNAL_SERVER_STATUS_CODE).json(APIResponse(STATUS.ERROR, error.message));
  }

  //Get Owner
  const owner = { user: req.user };
  let ownerUser;

  try {
    ownerUser = await userModel.findOne({ email: owner.user.email });
  } catch (error) {
    return res.status(INTERNAL_SERVER_STATUS_CODE).json(APIResponse(STATUS.ERROR, error.message));
  }

  // Check if requester is group's owner
  if (!groupInstance.ownerId.equals(ownerUser._id)) {
    return res.status(FORBIDDEN_STATUS_CODE).json(APIResponse(STATUS.ERROR, "You are not allowed to do this"));
  }

  try {
    if (groupInstance.coOwnerIds.includes(userId)) {
      let index = groupInstance.coOwnerIds.indexOf(userId);
      if (index > -1) {
        groupInstance.coOwnerIds.splice(index, 1);
      }
    } else {
      let index = groupInstance.memberIds.indexOf(userId);
      if (index > -1) {
        groupInstance.memberIds.splice(index, 1);
      }
    }

    let index = memberUser.joinedGroupIds.indexOf(groupId);
    if (index > -1) {
      memberUser.joinedGroupIds.splice(index, 1);
    }

    await memberUser.save();
    await groupInstance.save();
  } catch (error) {
    return res.status(INTERNAL_SERVER_STATUS_CODE).json(APIResponse(STATUS.ERROR, error.message));
  }

  return res.status(SUCCESS_STATUS_CODE).json(APIResponse(STATUS.OK, "Remove member successfully"));
};

// Get Data

export const getGroupDetail = async (req, res) => {
  try {
    const { token } = req.body;
    const groupId = req.param("groupId");
    //Get GroupInstance
    let groupInstance = await groupModel.findById(groupId)
  
    //Get member
    const member = jwt.decode(token);
    let memberUser;
  
    memberUser = await userModel.findOne({ email: member.user.email });
  
    if (groupInstance.ownerId.equals(memberUser._id) || groupInstance.memberIds.includes(memberUser._id) || groupInstance.coOwnerIds.includes(memberUser._id)) {
      return res.status(SUCCESS_STATUS_CODE).json(APIResponse(STATUS.OK, SUCCESS_STATUS_MESSAGE, groupInstance));
    } else {
      return res.status(FORBIDDEN_STATUS_CODE).json(APIResponse(STATUS.ERROR, "You are not allowed to do this"));
    }
  } catch (e) {
    return res.status(INTERNAL_SERVER_STATUS_CODE).json({
      status: STATUS.ERROR,
      data: [],
      message: e.message,
    });
  }
};

export const getGroupByIds = async (req, res) => {
  try {
    if (req.user) {
      const { ids = [] } = req.body;

      const groupList = await groupModel.find({
        _id: {
          $in: ids,
        },
      });

      return res.status(SUCCESS_STATUS_CODE).json({
        status: STATUS.OK,
        data: groupList,
        message: "Get group list successfully",
      });
    } else {
      return res.status(NOTFOUND_STATUS_CODE).json({
        status: STATUS.ERROR,
        data: [],
        message: "Not found",
      });
    }
  } catch (e) {
    return res.status(NOTFOUND_STATUS_CODE).json({
      status: STATUS.ERROR,
      data: [],
      message: e.message,
    });
  }
};

export const delGroupByIds = async (req, res) => {
  const id = req.param("id");

  //Get Owner
  const owner = { user: req.user };
  let ownerUser;

  try {
    ownerUser = await userModel.findOne({ email: owner.user.email });
  } catch (error) {
    return res.status(INTERNAL_SERVER_STATUS_CODE).json(APIResponse(STATUS.ERROR, error.message));
  }

  let existGroup;
  //Check name exists
  try {
    existGroup = await groupModel.findById(id);
    if (!existGroup) {
      return res.status(NOTFOUND_STATUS_CODE).json(APIResponse(STATUS.ERROR, NOTFOUND_STATUS_MESSAGE, "Group not found"));
    }
  } catch (error) {
    return res.status(INTERNAL_SERVER_STATUS_CODE).json(APIResponse(STATUS.ERROR, INTERNAL_SERVER_STATUS_MESSAGE, error.message));
  }

  //Check owner of group
  if (!existGroup.ownerId.equals(req.user._id)) {
    return res.status(FORBIDDEN_STATUS_CODE).json(APIResponse(STATUS.ERROR, FORBIDDEN_STATUS_MESSAGE, "You are not allowed"));
  }

  try {
    await groupModel.deleteOne({ _id: id });
    let index = ownerUser.myGroupIds.indexOf(id);
    if (index > -1) {
      ownerUser.myGroupIds.splice(index, 1);
    }
    await ownerUser.save()

    await userModel.updateMany({ joinedGroupIds: id }, { $pull: { joinedGroupIds: id } })
  } catch (error) {
    return res.status(INTERNAL_SERVER_STATUS_CODE).json(APIResponse(STATUS.ERROR, INTERNAL_SERVER_STATUS_MESSAGE, error.message));
  }

  //ALL SUCCESS
  return res.status(SUCCESS_STATUS_CODE).json(APIResponse(STATUS.OK, SUCCESS_STATUS_MESSAGE, "Remove successfully"));
};