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
import roomModel from "../../models/room.model.js";
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

  const newRoom = new roomModel({
    name,
    ownerId: ownerUser._id,
    memberIds: [],
    coOwnerIds: [],
  });

  //Add room to user
  ownerUser.myRoomIds.push(newRoom);
  try {
    await ownerUser.save();
    await newRoom.save();
  } catch (error) {
    return res
      .status(INTERNAL_SERVER_STATUS_CODE)
      .json(APIResponse(STATUS.ERROR, error.message));
  }

  //ALl SUCCESS
  return res
    .status(SUCCESS_STATUS_CODE)
    .json(APIResponse(STATUS.OK, "Create room successfully", newRoom));
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

  let updatedRoom;

  try {
    await roomModel.updateOne({ _id: id }, req.body);
    updatedRoom = await roomModel.findOne({ _id: id });
  } catch (error) {
    return res
      .status(INTERNAL_SERVER_STATUS_CODE)
      .json(APIResponse(STATUS.ERROR, error.message));
  }

  //ALL SUCCESS
  return res
    .status(SUCCESS_STATUS_CODE)
    .json(APIResponse(STATUS.OK, "Update room successfully", updatedRoom));
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

  //Get RoomInstance
  let roomInstance;

  try {
    roomInstance = await roomModel.findById(roomId);
  } catch (error) {
    return res
      .status(INTERNAL_SERVER_STATUS_CODE)
      .json(APIResponse(STATUS.ERROR, error.message));
  }

  //Check user already in room
  if (
    roomInstance.ownerId.equals(userId) ||
    roomInstance.coOwnerIds.includes(userId) ||
    roomInstance.memberIds.includes(userId)
  ) {
    return res
      .status(BAD_REQUEST_STATUS_CODE)
      .json(APIResponse(STATUS.ERROR, "User is already in this room!"));
  }

  roomInstance.memberIds.push(memberUser);
  memberUser.joinedRoomIds.push(roomInstance);

  try {
    await roomInstance.save();
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

  //Get RoomInstance
  let roomInstance;

  try {
    roomInstance = await roomModel.findById(roomId);
  } catch (error) {
    return res
      .status(INTERNAL_SERVER_STATUS_CODE)
      .json(APIResponse(STATUS.ERROR, error.message));
  }

  //Check if requester is room's owner
  if (!roomInstance.ownerId.equals(ownerUser._id)) {
    return res
      .status(FORBIDDEN_STATUS_CODE)
      .json(APIResponse(STATUS.ERROR, "You are not allowed to do this"));
  }

  if (isUpgrade) {
    //Move from member to co-owner
    var index = roomInstance.memberIds.indexOf(memberUser._id);
    if (index > -1) {
      roomInstance.memberIds.splice(index, 1);
    }

    roomInstance.coOwnerIds.push(memberUser);

    try {
      await roomInstance.save();
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
    var index = roomInstance.coOwnerIds.indexOf(memberUser._id);
    if (index > -1) {
      roomInstance.coOwnerIds.splice(index, 1);
    }

    roomInstance.memberIds.push(memberUser);

    try {
      await roomInstance.save();
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

  //Get RoomInstance
  let roomInstance;

  try {
    roomInstance = await roomModel.findById(roomId);
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

  // Check if requester is room's owner
  if (!roomInstance.ownerId.equals(ownerUser._id)) {
    return res
      .status(FORBIDDEN_STATUS_CODE)
      .json(APIResponse(STATUS.ERROR, "You are not allowed to do this"));
  }

  try {
    if (roomInstance.coOwnerIds.includes(userId)) {
      let index = roomInstance.coOwnerIds.indexOf(userId);
      if (index > -1) {
        roomInstance.coOwnerIds.splice(index, 1);
      }
    } else {
      let index = roomInstance.memberIds.indexOf(userId);
      if (index > -1) {
        roomInstance.memberIds.splice(index, 1);
      }
    }

    let index = memberUser.joinedRoomIds.indexOf(roomId);
    if (index > -1) {
      memberUser.joinedRoomIds.splice(index, 1);
    }

    await memberUser.save();
    await roomInstance.save();
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
    const roomId = req.param("roomId");
    //Get RoomInstance
    let roomInstance = await roomModel.findById(roomId);

    //Get member
    let memberUser = req.user;

    if (
      roomInstance.ownerId.equals(memberUser._id) ||
      roomInstance.memberIds.includes(memberUser._id) ||
      roomInstance.coOwnerIds.includes(memberUser._id)
    ) {
      const result = {
        ...roomInstance._doc,
        isOwner: roomInstance.ownerId.equals(memberUser._id),
      };

      return res
        .status(SUCCESS_STATUS_CODE)
        .json(APIResponse(STATUS.OK, SUCCESS_STATUS_MESSAGE, result));
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

      const roomList =
        ids?.length > 0
          ? await roomModel.find({
              _id: {
                $in: ids,
              },
            })
          : await roomModel.find();

      return res.status(SUCCESS_STATUS_CODE).json({
        status: STATUS.OK,
        data: roomList.map((room) => {
          return {
            ...room._doc,
            isOwner: room.ownerId.equals(req.user._id),
          };
        }),
        message: "Get room list successfully",
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

  let existRoom;
  //Check name exists
  try {
    existRoom = await roomModel.findById(id);
    if (!existRoom) {
      return res
        .status(NOTFOUND_STATUS_CODE)
        .json(APIResponse(STATUS.ERROR, "Room not found"));
    }
  } catch (error) {
    return res
      .status(INTERNAL_SERVER_STATUS_CODE)
      .json(APIResponse(STATUS.ERROR, error.message));
  }

  //Check owner of room
  if (!existRoom.ownerId.equals(req.user._id)) {
    return res
      .status(FORBIDDEN_STATUS_CODE)
      .json(APIResponse(STATUS.ERROR, "You are not allowed"));
  }

  try {
    await roomModel.deleteOne({ _id: id });
    let index = ownerUser.myRoomIds.indexOf(id);
    if (index > -1) {
      if (ownerUser.myRoomIds.length === 1) {
        ownerUser.myRoomIds = [];
      } else ownerUser.myRoomIds.splice(index, 1);
    }
    await ownerUser.save();

    await userModel.updateMany(
      { joinedRoomIds: id },
      { $pull: { joinedRoomIds: id } }
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
