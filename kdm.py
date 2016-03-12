from flask import Flask, request, session, g, redirect, url_for, abort, render_template, flash, Response

# Config
DEBUG = True



app = Flask(__name__)
app.config.from_object(__name__)

@app.route('/')
def show_entries():
  return render_template('index.html')
  
if __name__ == "__main__":
  app.run()
