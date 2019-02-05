const {Storage} = require('@google-cloud/storage');
const projectId = 'houm-host';

const storage = new Storage({
projectId: projectId,
});

const bucketName = 'test-bucket-random';

storage
  .createBucket(bucketName)
  .then(() => {
   console.log(`Bucket ${bucketName} is successfully created`);
})
.catch(err => {
  console.log("Error: ", err);
});


