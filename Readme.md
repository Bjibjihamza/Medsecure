docker run -d \
  --name medsecure-mongo \
  -p 27018:27017 \
  -v medsecure_mongo_data:/data/db \
  mongo:7
