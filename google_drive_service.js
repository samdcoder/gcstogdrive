const {google} = require('googleapis');
const fs = require('fs');
const key = require('./gdrive_service.json');

const drive = google.drive('v3');
const jwtClient = new google.auth.JWT(
  key.client_email,
  null,
  key.private_key,
  ['https://www.googleapis.com/auth/drive'],
  null
);

jwtClient.authorize((authErr) => {
  if (authErr) {
    console.log(authErr);
    return;
  }

  // Make an authorized requests

  // List Drive files.
  drive.files.list({ auth: jwtClient }, (listErr, resp) => {
    if (listErr) {
      console.log(listErr);
      return;
    }

    resp.data.files.forEach((file) => {
      console.log(`${file.name} (${file.mimeType})`);
    });
  });
});
