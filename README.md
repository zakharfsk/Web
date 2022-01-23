# Web

Пока він не нахостингу але вже зараз можна приєднатися декільком і поговорити.
Для цього вам потрібен ngrok.

Щоб все працювало консолі виконайте наступні дії:

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

І відправте другу вот цей адрес