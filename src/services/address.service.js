import Address from "@/models/address.model.js";
import APIError from "@/utils/APIError.js";
import APIFeatures from "@/utils/APIFeatures.js";

const addressService = {
  async getAll(queryString) {
    const features = new APIFeatures(Address, queryString)
      .search()
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const [address] = await features.execute();
    if (!address) {
      throw new APIError({
        status: 404,
        message: "No address Found with the ID.",
      });
    }
    return address;
  },
  async get(addressId) {
    const address = await Address.findById(addressId);
    if (!address) {
      throw new APIError({
        status: 404,
        message: "No address Found with the ID.",
      });
    }
    return address;
  },
  async update(addressId, body, user) {
    if (body.currentlyUse) {
      await Address.findOneAndUpdate(
        { currentlyUse: true, userId: user._id },
        { $set: { currentlyUse: false } },
        { new: true }
      );
    }
    const address = await Address.findByIdAndUpdate(addressId, body);
    if (!address) {
      throw new APIError({
        status: 404,
        message: "No address Found with the ID.",
      });
    }
    return address;
  },
  async delete(addressId) {
    const address = await Address.findById(addressId);
    if (address.currentlyUse === true) {
      const otherAddresses = await Address.find({ _id: { $ne: addressId } });
      if (otherAddresses && otherAddresses.length > 0) {
        const firstOtherAddress = otherAddresses[0];
        firstOtherAddress.currentlyUse = true;
        await firstOtherAddress.save();
      }
    }
    await address.deleteOne();
    if (!address) {
      throw new APIError({
        status: 404,
        message: "No address Found with the ID.",
      });
    }
    return address;
  },
  async create(body) {
    const address = await Address.create(body);
    if (!address) {
      throw new APIError({
        status: 404,
        message: "Address cannot be created.",
      });
    }
    return address;
  },
};

export default addressService;
