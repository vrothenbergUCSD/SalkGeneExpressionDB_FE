const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();
const db = admin.firestore()
const _ = require('underscore');

// Create and Deploy Your First Cloud Functions
// https://firebase.google.com/docs/functions/write-firebase-functions

exports.helloWorld = functions.https.onRequest((request, response) => {
  console.log('Hello..')
  functions.logger.info("Hello logs!", {
    structuredData: true,
  });
  response.send("Hello from Firebase!");
});

async function updatePermissionArray(uid, perm, group_id, add) {
  // Get user data, then add or remove group ID to corresponding permission array
  // console.log('getPermArrayThenAddGroupID', uid, perm, group_id)
  const user = db.doc(`users/${uid}`)
  return await user.get(perm).then(snap => {
    const data = snap.data()
    let perm_arr = data[perm]
    if (add && perm_arr.indexOf(group_id) === -1)
      perm_arr.push(group_id)
    if (!add)
      perm_arr = perm_arr.filter(gid => gid != group_id)

    const obj = {}
    obj[perm] = perm_arr
    return user.set(obj, { merge: true }).then(() => {
      // console.log('updatePermissionArray: Set successful')
      return true
    }).catch((error) => {
      console.error(error)
      return false
    })
  })
}

async function removeMemberGroup(removed_group_id, other_group_id) {
  // Used when permission group is deleted and was selected for user permssion 
  //  inheritance by another group
  // Removes group id from all group arrays in the other group object
  const group = db.doc(`permission_groups/${other_group_id}`)
  return group.get().then(snap => {
    const group_data = snap.data()
    group_data['admin_groups'] = group_data['admin_groups'].filter(e => e !== removed_group_id)
    group_data['editor_groups'] = group_data['editor_groups'].filter(e => e !== removed_group_id)
    group_data['reader_groups'] = group_data['reader_groups'].filter(e => e !== removed_group_id)

    return group.set(group_data, { merge: true }).then(() => {
      return true
    }).catch((error) => {
      console.error(error)
      return false
    })

  })
}

async function updateUsers(new_users, old_users, perm, group_id) {
  // console.log('updateUsers', perm, group_id)
  const users_to_add = _.difference(new_users, old_users)
  const users_to_remove = _.difference(old_users, new_users)
  const remove_results = await Promise.all(users_to_remove.map(async (uid) => {
    return updatePermissionArray(uid, perm, group_id, false)
  }))
  // console.log('remove_results')
  // console.log(remove_results)
  const add_results = await Promise.all(users_to_add.map(async (uid) => {
    return updatePermissionArray(uid, perm, group_id, true)
  }))
  // console.log('add_results')
  // console.log(add_results)
  const success = !(add_results.includes(false) || remove_results.includes(false))
  // console.log('updateUsers:', success ? 'Success' : 'Fail')
  return success
}

async function updateGroups(new_groups, old_groups, perm, group_id) {
  // group_id could be getting deleted
  //
  console.log('updateGroups', perm, group_id)
  const groups_to_add = _.difference(new_groups, old_groups)
  const groups_to_remove = _.difference(old_groups, new_groups)

  console.log('groups_to_add')
  console.log(groups_to_add)
  console.log('groups_to_remove')
  console.log(groups_to_remove)

  // Remove users from removed groups first
  const remove_results = await Promise.all(groups_to_remove.map(async (gid) => {
    // groups_to_remove = [other_gid_1, other_gid_2]
    const group = db.doc(`permission_groups/${gid}`)
    return group.get().then(async (snap) => {
      const group_data = snap.data()
      // group_data may not exist if it was deleted and triggered the cascade of update calls
      if (group_data === null)
        return true
      const users_to_remove = group_data[`${perm}_users`]
      group_data[`${perm}_groups`] = group_data[`${perm}_groups`].filter(e => e !== group_id)

      const result = await updateUsers([], users_to_remove, perm, group_id)
      return result
    }).catch((error) => {
      console.error(error)
      return false
    })
  }))

  console.log('updateGroups: remove_results')
  console.log(remove_results)

  // Add users from added groups 
  const add_results = await Promise.all(groups_to_add.map(async (gid) => {
    const group = db.doc(`permission_groups/${gid}`)
    return group.get().then(snap => {
      const group_data = snap.data()
      let users_to_add = group_data[`${perm}_users`]
      group_data['member_of'].push(group_id)
      const set_result = group.set(group_data, { merge: true }).then(() => {
        return true
      }).catch((error) => {
        console.error(error)
        return false
      })

      return set_result && updateUsers(users_to_add, [], perm, group_id)
    })
  }))
  console.log('updateGroups: add_results')
  console.log(add_results)

  const success = !(add_results.includes(false) || remove_results.includes(false))
  console.log('updateGroups:', success ? 'Success' : 'Fail')
  return success
}




//

exports.userCreate = functions.firestore.document('users/{user_id}')
  .onCreate(async (snap, context) => {
    // console.log('userCreate')
    const user_data = snap.data()
    // console.log('user_data')
    // console.log(user_data)
    const user_id = context.params.user_id
    if (!user_data.hasOwnProperty('admin'))
      user_data['admin'] = []
    if (!user_data.hasOwnProperty('editor'))
      user_data['editor'] = []
    if (!user_data.hasOwnProperty('reader'))
      user_data['reader'] = []

    if (!user_data.hasOwnProperty('firstName'))
      user_data['firstName'] = ''
    if (!user_data.hasOwnProperty('lastName'))
      user_data['lastName'] = ''
    if (!user_data.hasOwnProperty('institution'))
      user_data['institution'] = ''
    if (!user_data.hasOwnProperty('email'))
      user_data['email'] = ''

    const user = db.doc(`users/${user_id}`)

    return user.set(user_data, { merge: true }).then(() => {
      return true
    }).catch((error) => {
      console.error(error)
      return false
    })
  })

exports.userUpdate = functions.firestore.document('users/{user_id}')
  .onUpdate((change, context) => {
    // console.log('userUpdate')
    const user_before = change.before.data()
    // console.log('user_before')
    // console.log(user_before)
    const user_after = change.after.data()
    // console.log('user_after')
    // console.log(user_after)
    const user_id = context.params.user_id
    // console.log('user_id:', user_id)
    return 'End userUpdate'
  })

exports.userDelete = functions.firestore.document('users/{user_id}')
  .onDelete((snap, context) => {
    console.log('userDelete')
    const user_data = snap.data()
    // console.log('user_data')
    // console.log(user_data)

    const user_id = context.params.user_id
    console.log('user_id:', user_id)
    return 'End userDelete'
  })

exports.permissionGroupCreate = functions.firestore
  .document('permission_groups/{group_id}')
  .onCreate(async (snap, context) => {
    console.log('permissionGroupCreate')
    const group_data = snap.data()
    console.log('group_data')
    console.log(group_data)
    const group_id = context.params.group_id
    console.log('group_id', group_id)

    // Add empty arrays for users and groups if they don't exist
    if (!group_data.hasOwnProperty('admin_users'))
      group_data['admin_users'] = []
    if (!group_data.hasOwnProperty('editor_users'))
      group_data['editor_users'] = []
    if (!group_data.hasOwnProperty('reader_users'))
      group_data['reader_users'] = []
    if (!group_data.hasOwnProperty('admin_groups'))
      group_data['admin_groups'] = []
    if (!group_data.hasOwnProperty('editor_groups'))
      group_data['editor_groups'] = []
    if (!group_data.hasOwnProperty('reader_groups'))
      group_data['reader_groups'] = []
    if (!group_data.hasOwnProperty('description'))
      group_data['description'] = ''
    if (!group_data.hasOwnProperty('member_of'))
      group_data['member_of'] = []

    // Update group object in firestore
    const group = db.doc(`permission_groups/${group_id}`)
    await group.set(group_data, { merge: true }).then(() => {
      return true
    }).catch((error) => {
      console.error(error)
      return false
    })

    const user_results = await Promise.all([
      updateUsers(group_data.admin_users, [], 'admin', group_id),
      updateUsers(group_data.editor_users, [], 'editor', group_id),
      updateUsers(group_data.reader_users, [], 'reader', group_id)])
    console.log('user_results')
    console.log(user_results)

    const group_results = await Promise.all([
      updateGroups(group_data.admin_groups, [], 'admin', group_id),
      updateGroups(group_data.editor_groups, [], 'editor', group_id),
      updateGroups(group_data.reader_groups, [], 'reader', group_id)
    ])
    console.log('group_results')
    console.log(group_results)
    const success = !(user_results.includes(false) || group_results.includes(false))
    console.log('permissionGroupCreate:', success ? 'Success' : 'Fail')

    return success
  })

exports.permissionGroupUpdate = functions.firestore
  .document('permission_groups/{group_id}')
  .onUpdate(async (change, context) => {
    console.log('permissionGroupUpdate')
    const before = change.before.data()
    const after = change.after.data()
    // console.log('before')
    // console.log(before)
    // console.log('after')
    // console.log(after)

    const group_id = context.params.group_id
    console.log('group_id', group_id)

    const user_results = await Promise.all([
      updateUsers(after.admin_users, before.admin_users, 'admin', group_id),
      updateUsers(after.editor_users, before.editor_users, 'editor', group_id),
      updateUsers(after.reader_users, before.reader_users, 'reader', group_id)])
    // console.log('user_results')
    // console.log(user_results)

    const group_results = await Promise.all([
      updateGroups(after.admin_groups, before.admin_groups, 'admin', group_id),
      updateGroups(after.editor_groups, before.editor_groups, 'editor', group_id),
      updateGroups(after.reader_groups, before.reader_groups, 'reader', group_id)
    ])
    // console.log('group_results')
    // console.log(group_results)

    const success = !(user_results.includes(false) || group_results.includes(false))

    console.log('permissionGroupUpdate:', success ? 'Success' : 'Fail')
    return success
  })

exports.permissionGroupDelete = functions.firestore
  .document('permission_groups/{group_id}')
  .onDelete(async (snap, context) => {
    // console.log('permissionGroupDelete')
    const group_data = snap.data()
    const group_id = context.params.group_id
    const user_results = await Promise.all([
      updateUsers([], group_data.admin_users, 'admin', group_id),
      updateUsers([], group_data.editor_users, 'editor', group_id),
      updateUsers([], group_data.reader_users, 'reader', group_id)])
    console.log('user_results')
    console.log(user_results)
    const group_results = await Promise.all([
      updateGroups([], group_data.admin_groups, 'admin', group_id),
      updateGroups([], group_data.editor_groups, 'editor', group_id),
      updateGroups([], group_data.reader_groups, 'reader', group_id)
    ])
    console.log('group_results')
    console.log(group_results)

    // Delete group_id from each group it is a member of
    const member_results = await Promise.all(group_data['member_of'].map(async (gid) => {
      return removeMemberGroup(group_id, gid)
    }))

    const success = !(
      user_results.includes(false)
      || group_results.includes(false)
      || member_results.includes(false)
    )
    console.log('permissionGroupDelete:', success ? 'Success' : 'Fail')
    return success

  })