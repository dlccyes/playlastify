cicd: ci cd
ci:
	gcloud builds submit --tag gcr.io/playlastify/playlastify
cd:
	gcloud run deploy --image gcr.io/playlastify/playlastify
run:
	python3 manage.py runserver 0.0.0.0:8080
