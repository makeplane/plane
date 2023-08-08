import fileService from 'services/file.service';

const UploadImageHandler = (file: File): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append("asset", file);
    formData.append("attributes", JSON.stringify({}));

    return new Promise(async (resolve, reject) => {
      const imageUrl = await fileService
        .uploadFile("plane", formData)
        .then((response) => response.asset);

      console.log(imageUrl, "imageurl")
      const image = new Image();
      image.src = imageUrl;
      image.onload = () => {
        resolve(imageUrl);
      };
    })
  }
  catch (error) {
    console.log(error)
    return Promise.reject(error);
  }
};

export default UploadImageHandler;
