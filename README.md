# Web

Пока він не нахостингу але вже зараз можна приєднатися декільком і поговорити.
Для цього вам потрібен ngrok.

Щоб все працювало консолі виконайте наступні дії:

Windows:
```
pip install virtualenv
virtualenv env
env\Scripts\activate.bat
pip install -r requirements.txt
python manage.py runserver
```

Після цього відкрийте файл `ngrok.exe` і в консолі пропишіть:

```
ngrok.exe http 8000
```
І відправте другу вот цей адрес.

Linux:

```
curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null &&
              echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list &&
              sudo apt update && sudo apt install ngrok   
              
```
```
pip install virtualenv
virtualenv env
source env\Scripts\activate
pip install -r requirements.txt
python manage.py runserver
```
Після цього запустіть `ngrok`:
```
ngrok.exe http 8000
```