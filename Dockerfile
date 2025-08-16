FROM python:3.10-slim
ENV PYTHONUNBUFFERED True
ENV APP_HOME /app
WORKDIR $APP_HOME
COPY . ./
RUN pip install -r requirements.txt
CMD ["gunicorn", "playlastify.wsgi:application", "--workers", "2", "--threads", "4"]