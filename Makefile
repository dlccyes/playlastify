cicd: ci cd
ci:
	gcloud builds submit --tag gcr.io/playlastify/playlastify
cd:
	gcloud run deploy --image gcr.io/playlastify/playlastify