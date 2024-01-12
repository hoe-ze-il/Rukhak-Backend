import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    To: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    From: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    title: String,
    content: String,
    notificationType: String,
    opened: { type: Boolean, default: false },
    entityId: mongoose.Schema.Types.ObjectId,
  },
  { timestamps: true }
);

// Static method for creating or updating a notification
NotificationSchema.statics.insertNotification = async (
  To,
  From,
  title,
  content,
  notificationType,
  entityId
) => {
  try {
    let data = {
      To: To,
      From: From,
      title: title,
      content: content,
      notificationType: notificationType,
      entityId: entityId,
    };

    await Notification.deleteOne(data);
    return Notification.create(data);
  } catch (error) {
    console.error("Error processing notification:", error);
  }
};

const Notification = mongoose.model("Notification", NotificationSchema);

export default Notification;
