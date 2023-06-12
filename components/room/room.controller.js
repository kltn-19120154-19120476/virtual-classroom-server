import jwt from "jsonwebtoken";
import { STATUS } from "../../constants/common.js";
import {
  BAD_REQUEST_STATUS_CODE,
  FORBIDDEN_STATUS_CODE,
  INTERNAL_SERVER_STATUS_CODE,
  NOTFOUND_STATUS_CODE,
  SUCCESS_STATUS_CODE,
  SUCCESS_STATUS_MESSAGE,
} from "../../constants/http-response.js";

import dotenv from "dotenv";
import { APIResponse } from "../../models/APIResponse.js";
import groupModel from "../../models/group.model.js";
import userModel from "../../models/user.model.js";
dotenv.config();
// Interact Data

export const createRoom = async (req, res) => {
  const { name, token } = req.body;

  //Get Owner
  const owner = jwt.decode(token);
  let ownerUser;

  try {
    ownerUser = await userModel.findOne({ email: owner.user.email });
  } catch (error) {
    return res
      .status(INTERNAL_SERVER_STATUS_CODE)
      .json(APIResponse(STATUS.ERROR, error.message));
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
    return res
      .status(INTERNAL_SERVER_STATUS_CODE)
      .json(APIResponse(STATUS.ERROR, error.message));
  }

  //ALl SUCCESS
  return res
    .status(SUCCESS_STATUS_CODE)
    .json(APIResponse(STATUS.OK, "Create room successfully", newGroup));
};

export const updateRoom = async (req, res) => {
  const { token, id } = req.body;

  //Get Owner
  const owner = jwt.decode(token);
  let ownerUser;

  try {
    ownerUser = await userModel.findOne({ email: owner.user.email });
  } catch (error) {
    return res
      .status(INTERNAL_SERVER_STATUS_CODE)
      .json(APIResponse(STATUS.ERROR, error.message));
  }

  let updatedGroup;

  try {
    await groupModel.updateOne({ _id: id }, req.body);
    updatedGroup = await groupModel.findOne({ _id: id });
  } catch (error) {
    return res
      .status(INTERNAL_SERVER_STATUS_CODE)
      .json(APIResponse(STATUS.ERROR, error.message));
  }

  //ALL SUCCESS
  return res
    .status(SUCCESS_STATUS_CODE)
    .json(APIResponse(STATUS.OK, "Update group successfully", updatedGroup));
};

export const addUser = async (req, res) => {
  const { roomId, userEmail } = req.body;

  //Get Member
  let memberUser;

  try {
    memberUser = await userModel.findOne({ email: userEmail });
  } catch (error) {
    return res
      .status(INTERNAL_SERVER_STATUS_CODE)
      .json(APIResponse(STATUS.ERROR, error.message));
  }

  if (!memberUser?._id) {
    return res
      .status(NOTFOUND_STATUS_CODE)
      .json(APIResponse(STATUS.ERROR, "User does not exist"));
  }

  const userId = memberUser._id;

  //Get GroupInstance
  let groupInstance;

  try {
    groupInstance = await groupModel.findById(roomId);
  } catch (error) {
    return res
      .status(INTERNAL_SERVER_STATUS_CODE)
      .json(APIResponse(STATUS.ERROR, error.message));
  }

  //Check user already in group
  if (
    groupInstance.ownerId.equals(userId) ||
    groupInstance.coOwnerIds.includes(userId) ||
    groupInstance.memberIds.includes(userId)
  ) {
    return res
      .status(BAD_REQUEST_STATUS_CODE)
      .json(APIResponse(STATUS.ERROR, "User is already in this group!"));
  }

  groupInstance.memberIds.push(memberUser);
  memberUser.joinedGroupIds.push(groupInstance);

  try {
    await groupInstance.save();
    await memberUser.save();
  } catch (error) {
    return res
      .status(INTERNAL_SERVER_STATUS_CODE)
      .json(APIResponse(STATUS.ERROR, error.message));
  }

  return res
    .status(SUCCESS_STATUS_CODE)
    .json(APIResponse(STATUS.OK, "Add user to room successfully"));
};

export const upgradeRole = async (req, res) => {
  const { memberId, roleCode, roomId, token, isUpgrade } = req.body;

  // Get owner information
  const owner = jwt.decode(token);
  let ownerUser;

  try {
    ownerUser = await userModel.findOne({ email: owner.user.email });
  } catch (error) {
    return res
      .status(INTERNAL_SERVER_STATUS_CODE)
      .json(APIResponse(STATUS.ERROR, error.message));
  }

  // Get member information
  let memberUser;

  try {
    memberUser = await userModel.findById(memberId);
  } catch (error) {
    return res
      .status(INTERNAL_SERVER_STATUS_CODE)
      .json(APIResponse(STATUS.ERROR, error.message));
  }

  //Get GroupInstance
  let groupInstance;

  try {
    groupInstance = await groupModel.findById(roomId);
  } catch (error) {
    return res
      .status(INTERNAL_SERVER_STATUS_CODE)
      .json(APIResponse(STATUS.ERROR, error.message));
  }

  //Check if requester is group's owner
  if (!groupInstance.ownerId.equals(ownerUser._id)) {
    return res
      .status(FORBIDDEN_STATUS_CODE)
      .json(APIResponse(STATUS.ERROR, "You are not allowed to do this"));
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
      return res
        .status(INTERNAL_SERVER_STATUS_CODE)
        .json(APIResponse(STATUS.ERROR, error.message));
    }

    return res
      .status(SUCCESS_STATUS_CODE)
      .json(APIResponse(STATUS.OK, "Upgrade role successfully"));
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
      return res
        .status(INTERNAL_SERVER_STATUS_CODE)
        .json(APIResponse(STATUS.ERROR, error.message));
    }

    return res
      .status(SUCCESS_STATUS_CODE)
      .json(APIResponse(STATUS.OK, "Downgrade role successfully"));
  }
};

export const removeUser = async (req, res) => {
  const { roomId, userEmail } = req.body;

  // //Get Member
  let memberUser;

  try {
    memberUser = await userModel.findOne({ email: userEmail });
  } catch (error) {
    return res
      .status(INTERNAL_SERVER_STATUS_CODE)
      .json(APIResponse(STATUS.ERROR, error.message));
  }

  if (!memberUser?._id) {
    return res
      .status(NOTFOUND_STATUS_CODE)
      .json(APIResponse(STATUS.ERROR, "User does not exist"));
  }

  const userId = memberUser._id;

  //Get GroupInstance
  let groupInstance;

  try {
    groupInstance = await groupModel.findById(roomId);
  } catch (error) {
    return res
      .status(INTERNAL_SERVER_STATUS_CODE)
      .json(APIResponse(STATUS.ERROR, error.message));
  }

  //Get Owner
  const owner = { user: req.user };
  let ownerUser;

  try {
    ownerUser = await userModel.findOne({ email: owner.user.email });
  } catch (error) {
    return res
      .status(INTERNAL_SERVER_STATUS_CODE)
      .json(APIResponse(STATUS.ERROR, error.message));
  }

  // Check if requester is group's owner
  if (!groupInstance.ownerId.equals(ownerUser._id)) {
    return res
      .status(FORBIDDEN_STATUS_CODE)
      .json(APIResponse(STATUS.ERROR, "You are not allowed to do this"));
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

    let index = memberUser.joinedGroupIds.indexOf(roomId);
    if (index > -1) {
      memberUser.joinedGroupIds.splice(index, 1);
    }

    await memberUser.save();
    await groupInstance.save();
  } catch (error) {
    return res
      .status(INTERNAL_SERVER_STATUS_CODE)
      .json(APIResponse(STATUS.ERROR, error.message));
  }

  return res
    .status(SUCCESS_STATUS_CODE)
    .json(APIResponse(STATUS.OK, "Remove user successfully"));
};

// Get Data

export const getRoomDetail = async (req, res) => {
  try {
    const { token } = req.body;
    const roomId = req.param("roomId");
    //Get GroupInstance
    let groupInstance = await groupModel.findById(roomId);

    //Get member
    const member = jwt.decode(token);
    let memberUser;

    memberUser = await userModel.findOne({ email: member.user.email });

    if (
      groupInstance.ownerId.equals(memberUser._id) ||
      groupInstance.memberIds.includes(memberUser._id) ||
      groupInstance.coOwnerIds.includes(memberUser._id)
    ) {
      return res
        .status(SUCCESS_STATUS_CODE)
        .json(APIResponse(STATUS.OK, SUCCESS_STATUS_MESSAGE, groupInstance));
    } else {
      return res
        .status(FORBIDDEN_STATUS_CODE)
        .json(APIResponse(STATUS.ERROR, "You are not allowed to do this"));
    }
  } catch (e) {
    return res.status(INTERNAL_SERVER_STATUS_CODE).json({
      status: STATUS.ERROR,
      data: [],
      message: e.message,
    });
  }
};

export const getRoomByIds = async (req, res) => {
  try {
    if (req.user) {
      const { ids = [] } = req.body;

      const groupList =
        ids?.length > 0
          ? await groupModel.find({
              _id: {
                $in: ids,
              },
            })
          : await groupModel.find();

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

export const delRoomByIds = async (req, res) => {
  const id = req.param("id");

  //Get Owner
  const owner = { user: req.user };
  let ownerUser;

  try {
    ownerUser = await userModel.findOne({ email: owner.user.email });
  } catch (error) {
    return res
      .status(INTERNAL_SERVER_STATUS_CODE)
      .json(APIResponse(STATUS.ERROR, error.message));
  }

  let existGroup;
  //Check name exists
  try {
    existGroup = await groupModel.findById(id);
    if (!existGroup) {
      return res
        .status(NOTFOUND_STATUS_CODE)
        .json(APIResponse(STATUS.ERROR, "Group not found"));
    }
  } catch (error) {
    return res
      .status(INTERNAL_SERVER_STATUS_CODE)
      .json(APIResponse(STATUS.ERROR, error.message));
  }

  //Check owner of group
  if (!existGroup.ownerId.equals(req.user._id)) {
    return res
      .status(FORBIDDEN_STATUS_CODE)
      .json(APIResponse(STATUS.ERROR, "You are not allowed"));
  }

  try {
    await groupModel.deleteOne({ _id: id });
    let index = ownerUser.myGroupIds.indexOf(id);
    if (index > -1) {
      if (ownerUser.myGroupIds.length === 1) {
        ownerUser.myGroupIds = [];
      } else ownerUser.myGroupIds.splice(index, 1);
    }
    await ownerUser.save();

    await userModel.updateMany(
      { joinedGroupIds: id },
      { $pull: { joinedGroupIds: id } }
    );
  } catch (error) {
    return res
      .status(INTERNAL_SERVER_STATUS_CODE)
      .json(APIResponse(STATUS.ERROR, error.message));
  }

  //ALL SUCCESS
  return res
    .status(SUCCESS_STATUS_CODE)
    .json(APIResponse(STATUS.OK, "Remove room successfully"));
};
