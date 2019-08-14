# Urbit Grants

[→ Prod site](http://grants.urbit.org)

[→ Prod admin](http://grants-admin.urbit.org)

[→ Stage frontend](https://tlon-grant-stage-frontend.herokuapp.com)

[→ Stage admin](https://tlon-grant-stage-admin.herokuapp.com)

This is a collection of the various services and components that make up the Urbit Grants.

### Development/Deployment Process

**DO NOT DIRECTLY MERGE/DEPLOY THIS BRANCH TO MASTER/PROD** 

The /backend directory of this branch removes all admin portal authentication services.  This grants the developer the ability to view changes to the admin portal.  

If you'd like to push changes to master or Heroku's prod apps, you must **remove all changes** made to [backend/grant/admin/utils/admin.py](backend/grant/utils/admin.py).  

### Heroku Deployment

This branch is currently connected to Heroku's staged versions of [grants.urbit.org](https://grants.urbit.org/).  This means that any changes pushed to this branch will automatically deploy to the stage-admin, stage-frontend and stage-backend Heroku apps, hosted [here](https://tlon-grant-stage-frontend.herokuapp.com/).  

### Setup

Instructions for each respective component can be found in:

- `/backend/README.md`

- `/frontend/README.md`

- `/admin/README.md`

- `/e2e/README.md`

We currently only offer instructions for unix based systems. Windows may or may not be compatible.

### Heroku

Our heroku setup uses separate apps for each component of the monorepo.

Be sure to replace `myappbasename` with your own base-name.

**Create**
Execute the `heroku-create-apps` script

```bash
chmod u+x heroku-create-apps
./heroku-create-apps myappbasename
```

This should generate apps and set up git remotes to deploy to.

**Add**
If the apps have already been created, and you want to be able to deploy to them, you
may use the heroku commands below to setup remotes.

```bash
heroku git:remote -a myappbasename-backend -r myappbasename-backend
heroku git:remote -a myappbasename-frontend -r myappbasename-frontend
heroku git:remote -a myappbasename-admin -r myappbasename-admin
heroku git:remote -a myappbasename-eip712 -r myappbasename-eip712
```

**Setup**

Add addons to the following dynos:
* Backend
  * Postgres (Standard 0 if you want backups)
* Backend, Frontend, EIP-712
  * Timber (Optional logging)
  
Initialize the database by running

```
heroku run "cd backend && flask db upgrade" --app myappbasename-backend
```

Add environment variables for each app based on their `.env.example`. To configure everything, you'll need:
* An AWS S3 instance (see backend/README.md)
* A Sendgrid account
* Sentry apps for backend and frontend
* Twitter and GitHub OAuth apps
* An Infura instance

**Deploy**
To push to heroku, build & deploy:

```bash
git push myappbasename-backend HEAD:master
git push myappbasename-frontend HEAD:master
git push myappbasename-admin HEAD:master
git push myappbasename-eip712 HEAD:master
```
