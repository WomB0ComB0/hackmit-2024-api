```bash
   docker build -t hackmit-2024-api:v1 .

   docker tag hackmit-2024-api:v1 gcr.io/hackmit-2024-api/hackmit-2024-api:v1

   docker push gcr.io/hackmit-2024-api/hackmit-2024-api:v1

   gcloud container images list-tags gcr.io/hackmit-2024-api/hackmit-2024-api

   gcloud run deploy hackmit-2024-api \
     --image gcr.io/hackmit-2024-api/hackmit-2024-api:v1 \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated

  gcloud config set project hackmit-2024-api
```
