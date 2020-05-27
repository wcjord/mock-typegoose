import { isDocument, isDocumentArray, isRefType, isRefTypeArray, mongoose } from '../../src/typegoose';
import {
  IsRefType,
  IsRefTypeArray,
  IsRefTypeArrayModel,
  IsRefTypeModel,
  IsRefTypeNestedObjectIdModel,
  IsRefTypeNestedStringModel
} from '../models/isRefType';
import { UserRefModel } from '../models/userRefs';

describe('isDocument / isDocumentArray', () => {
  it('should guarantee array of document types', async () => {
    const UserMaster = await UserRefModel.create({
      name: 'master'
    });
    const UserSub = await UserRefModel.create({
      name: 'sub'
    });

    UserMaster.subAccounts.push(UserSub._id);

    await UserMaster.populate('subAccounts').execPopulate();

    if (isDocumentArray(UserMaster.subAccounts)) {
      expect(UserMaster.subAccounts).toHaveLength(1);
      for (const doc of UserMaster.subAccounts) {
        expect(doc.name).toEqual('sub');
        expect(doc.name).not.toEqual('other');
      }
    } else {
      fail('"UserMaster.subAccounts" is not populated!');
    }
  });

  it('should guarantee single document type', async () => {
    const UserMaster = await UserRefModel.create({
      name: 'master'
    });
    const UserSub = await UserRefModel.create({
      name: 'sub'
    });

    UserSub.master = UserMaster._id;

    await UserSub.populate('master').execPopulate();

    if (isDocument(UserSub.master)) {
      expect(UserSub.master.name).toEqual('master');
      expect(UserSub.master.name).not.toEqual('other');
    } else {
      fail('"UserSub.master" is not populated!');
    }
  });

  it('should detect if array of refs is not populated', async () => {
    const UserMaster = await UserRefModel.create({
      name: 'master'
    });
    const UserSub = await UserRefModel.create({
      name: 'sub'
    });
    UserMaster.subAccounts.push(UserSub._id);

    if (!isDocumentArray(UserMaster.subAccounts)) {
      expect(UserMaster.subAccounts).toHaveLength(1);
      for (const doc of UserMaster.subAccounts) {
        expect(doc).not.toHaveProperty('name');
      }
    } else {
      fail('"UserMaster.subAccounts" is populated where it should not!');
    }
  });

  it('should detect if ref is not populated', async () => {
    const UserMaster = await UserRefModel.create({
      name: 'master'
    });
    const UserSub = await UserRefModel.create({
      name: 'sub'
    });

    UserSub.master = UserMaster._id;

    if (!isDocument(UserSub.master)) {
      expect(UserSub.master).not.toHaveProperty('name');
    } else {
      fail('"UserSub.master" is populated where it should not!');
    }
  });

  it('should handle recursive populations - multiple populates', async () => {
    const User1 = await UserRefModel.create({
      name: '1'
    });
    const User2 = await UserRefModel.create({
      name: '2',
      master: User1._id
    });
    const User3 = await UserRefModel.create({
      name: '3',
      master: User2._id
    });

    await User3.populate('master').execPopulate();
    if (isDocument(User3.master)) {
      // User3.master === User2
      await User3.master.populate('master').execPopulate();
      if (isDocument(User3.master.master)) {
        // User3.master.master === User1
        expect(User3.master.master.name).toEqual(User1.name);
      } else {
        fail('User3.master.master should be populated!');
      }
    } else {
      fail('User3.master should be populated!');
    }

    await User3.populate({
      path: 'master',
      populate: {
        path: 'master'
      }
    }).execPopulate();
  });

  it('should handle recursive populations - single populate', async () => {
    const User1 = await UserRefModel.create({
      name: '1'
    });
    const User2 = await UserRefModel.create({
      name: '2',
      master: User1._id
    });
    const User3 = await UserRefModel.create({
      name: '3',
      master: User2._id
    });

    await User3.populate({
      path: 'master',
      populate: {
        path: 'master'
      }
    }).execPopulate();
    if (isDocument(User3.master) && isDocument(User3.master.master)) {
      // User3.master === User2 && User3.master.master === User1
      expect(User3.master.name).toEqual(User2.name);
      expect(User3.master.master.name).toEqual(User1.name);
    } else {
      fail('"User3" should be deep populated!');
    }
  });
});

describe('isRefType / isRefTypeArray', () => {
  describe('isRefType', () => {
    it('should guarantee the RefType - String', async () => {
      const doc = await IsRefTypeModel.create({
        nestedString: await IsRefTypeNestedStringModel.create({ _id: 'should guarantee the RefType' })
      } as IsRefType);
      doc.depopulate('nestedString');

      expect(doc.nestedString).not.toBeUndefined();

      if (isRefType(doc.nestedString)) {
        expect(typeof doc.nestedString).toBe('string');
      } else {
        fail('Expected isRefType to be returning true');
      }
    });

    it('should guarantee the RefType - ObjectId', async () => {
      const doc = await IsRefTypeModel.create({
        nestedObjectId: await IsRefTypeNestedObjectIdModel.create({ _id: new mongoose.Types.ObjectId() })
      } as IsRefType);
      doc.depopulate('nestedObjectId');

      expect(doc.nestedObjectId).not.toBeUndefined();

      if (isRefType(doc.nestedObjectId)) {
        expect(doc.nestedObjectId).toBeInstanceOf(mongoose.Types.ObjectId);
      } else {
        fail('Expected isRefType to be returning true');
      }
    });
  });

  describe('isRefTypeArray', () => {
    it('should guarantee the RefType - String', async () => {
      const doc = await IsRefTypeArrayModel.create({
        nestedString: [await IsRefTypeNestedStringModel.create({ _id: 'should guarantee the RefType - Array' })]
      } as IsRefTypeArray);
      doc.depopulate('nestedString');

      expect(doc.nestedString).not.toBeUndefined();

      if (isRefTypeArray(doc.nestedString!)) {
        expect(Array.isArray(doc.nestedString)).toBe(true);
        expect(typeof doc.nestedString![0]).toBe('string');
      } else {
        fail('Expected isRefTypeArray to be returning true');
      }
    });

    it('should guarantee the RefType - ObjectId', async () => {
      const doc = await IsRefTypeArrayModel.create({
        nestedObjectId: [await IsRefTypeNestedObjectIdModel.create({ _id: new mongoose.Types.ObjectId() })]
      } as IsRefTypeArray);
      doc.depopulate('nestedObjectId');

      expect(doc.nestedObjectId).not.toBeUndefined();

      if (isRefTypeArray(doc.nestedObjectId!)) {
        expect(Array.isArray(doc.nestedString)).toBe(true);
        expect(doc.nestedObjectId![0]).toBeInstanceOf(mongoose.Types.ObjectId);
      } else {
        fail('Expected isRefTypeArray to be returning true');
      }
    });
  });
});
