import factory from "@/controllers/factory.js";
import addressService from "@/services/address.service.js";

const addressController = {
  getAllAddresses: factory.getAll(addressService.getAll),
  getAddress: factory.getById(addressService.get),
  createAddress: factory.create(addressService.create),
  updateAddress: factory.updateById(addressService.update),
  deleteAddress: factory.deleteById(addressService.delete),
};

export default addressController;
