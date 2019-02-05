const {google} = require('googleapis');
const fs = require('fs');
const key = require('./gdrive_service.json');

const jwtClient = new google.auth.JWT(
  key.client_email,
  null,
  key.private_key,
  ['https://www.googleapis.com/auth/drive', 'https://www.googleapis.com/auth/drive.file','https://www.googleapis.com/auth/drive.metadata.readonly'],
  null
);

jwtClient.authorize((authErr) => {
  if (authErr) {
    console.log(authErr);
    return;
  }
  const drive = google.drive({version: 'v3', auth: jwtClient});

  // Make an authorized requests

  // List Drive files.
  drive.files.list((listErr, resp) => {
    if (listErr) {
      console.log(listErr);
      return;
    }

    resp.data.files.forEach((file) => {
      console.log(`${file.name} (${file.mimeType})`);
    });
  });
var fileMetadata = {
'name': 'photo.jpg',
parents: ['1oKs1GTSvOQCcPMaN43x9pCfjq3opbBel']
};
var media = {
mimeType: 'image/jpeg',
body: fs.createReadStream('./photo.jpg')
};
drive.files.create({
resource: fileMetadata,
media: media,
fields: 'id'
}, function (err, file) {
if (err) {
  // Handle error
  console.error(err);
} else {
  console.log('File Id: ', file.id);
}
});
});
