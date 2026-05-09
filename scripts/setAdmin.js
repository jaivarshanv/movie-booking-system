const admin = require('firebase-admin');

// IMPORTANT: Path to your service account key file
const serviceAccount = require('./serviceAccountKey.json');

// Get the Target UID from the command line arguments
const targetUid = process.argv[2];

if (!targetUid) {
  console.error("Please provide a UID.");
  console.error("Usage: node setAdmin.js <USER_UID>");
  process.exit(1);
}

// Initialize the Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function makeAdmin() {
  try {
    const roleRef = db.collection('user_roles').doc(targetUid);

    // Set the role to admin, merging with any existing data
    await roleRef.set({
      role: 'admin',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    console.log(`Successfully set 'admin' role for UID: ${targetUid}`);
    process.exit(0);
  } catch (error) {
    console.error("Error setting admin role:", error);
    process.exit(1);
  }
}

makeAdmin();
