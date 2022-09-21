import _ from 'underscore'

const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();
const db = admin.firestore()

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
async function updatePermissionArray(uid, perm, group_id, add) {
  // Get user data, then add or remove group ID to corresponding permission array
  // console.log('getPermArrayThenAddGroupID', uid, perm, group_id)
  const user = db.doc(`users/${uid}`)
  user.get(perm).then(snap => {
    const data = snap.data()
    let perm_arr = []
    if (data.hasOwnProperty(perm))
      perm_arr = data[perm]
    if (add && perm_arr.indexOf(group_id) === -1)
      perm_arr.push(group_id)
    if (!add)
      perm_arr = perm_arr.filter(gid => gid != group_id)

    const obj = {}
    obj[perm] = perm_arr
    user.set(obj, { merge: true })
  })
}

async function updateUsers(new_users, old_users, perm, group_id) {
  const users_to_add = _.difference(new_users, old_users)
  const users_to_remove = _.difference(old_users, new_users)
  Promise.all(users_to_remove.map(async (uid) => {
    updatePermissionArray(uid, perm, group_id, false)
  }))
  Promise.all(users_to_add.map(async (uid) => {
    updatePermissionArray(uid, perm, group_id, true)
  }))
}

async function updateGroups(new_groups, old_groups, perm, group_id) {
  const groups_to_add = _.difference(new_groups, old_groups)
  const groups_to_remove = _.difference(old_groups, new_groups)

  // Remove users from removed groups first
  Promise.all(groups_to_remove.map(async (gid) => {
    const group = db.doc(`permission_groups/${gid}`)
    group.get().then(snap => {
      const data = snap.data()
      let users_to_remove = []
      if (data.hasOwnProperty(`${perm}_users`))
        users_to_remove = data[`${perm}_users`]
      updateUsers([], users_to_remove, perm, group_id)
    })
  }))

  // Add users from added groups 
  Promise.all(groups_to_add.map(async (gid) => {
    const group = db.doc(`permission_groups/${gid}`)
    group.get().then(snap => {
      const data = snap.data()
      let users_to_add = []
      if (data.hasOwnProperty(`${perm}_users`))
        users_to_add = data[`${perm}_users`]
      updateUsers(users_to_add, [], perm, group_id)
    })
  }))
}

exports.helloWorld = functions.https.onRequest((request, response) => {
  functions.logger.info("Hello logs!", {
    structuredData: true,
  });
  response.send("Hello from Firebase!");
});

exports.updatePermissions = functions.firestore
  .document('permission_groups/{group_id}')
  .onCreate((snap, context) => {
    console.log('onCreate')
    const group_data = snap.data()
    const group_id = context.params.group_id
    updateUsers(group_data.admin_users, [], 'admin', group_id)
    updateUsers(group_data.editor_users, [], 'editor', group_id)
    updateUsers(group_data.reader_users, [], 'reader', group_id)

    group_data.admin_groups
  })

exports.updatePermissions = functions.firestore
  .document('permission_groups/{group_id}')
  .onUpdate((change, context) => {
    console.log('onUpdate')
    const before = change.before.data()
    const after = change.after.data()
    console.log('before')
    console.log(before)
    console.log('after')
    console.log(after)

    const group_id = context.params.group_id

    updateUsers(after.admin_users, before.admin_users, 'admin', group_id)
    updateUsers(after.editor_users, before.editor_users, 'editor', group_id)
    updateUsers(after.reader_users, before.reader_users, 'reader', group_id)
  })

exports.updatePermissions = functions.firestore
  .document('permission_groups/{group_id}')
  .onDelete((snap, context) => {
    console.log('onDelete')
    const group_data = snap.data()
    const group_id = context.params.group_id
    updateUsers([], group_data.admin_users, 'admin', group_id)
    updateUsers([], group_data.editor_users, 'editor', group_id)
    updateUsers([], group_data.reader_users, 'reader', group_id)
    updateGroups([], group_data.admin_groups,)

  })