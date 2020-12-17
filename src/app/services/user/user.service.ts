import { Injectable } from '@angular/core';
import { AngularFireDatabase, AngularFireList } from '@angular/fire/database';
import { User } from './user';

@Injectable({
  providedIn: 'root'
})

export class UserService {
  private dbPath = '/users';
  usersRef: AngularFireList<User> = null;
  dbRef: any;
  loggedInUser: User;
  localStorage: Storage;

  constructor(private db: AngularFireDatabase) {
    this.usersRef = db.list(this.dbPath);
    this.localStorage = window.localStorage
  }

  /* After user sign up, create new reference to that user in DB */
  create(user: any, name: string): any {
    this.dbRef = this.db.database.ref().child('users');
    this.dbRef.child(`${user.uid}`).set({
      name: name,
      friend: {
        "-": "dummy"
      }
    });

    this.db.database.ref().child('location').child(`${user.uid}`).set({
      "-": "dummy"
    });
  }

  get isLocalStorageSupported(): boolean {
    return !!this.localStorage
  }

  /* After Logging In, Save User Information */
  setLoggedInUser(uid: string) {
    this.loggedInUser = new User();
    this.dbRef = this.db.database.ref('users/' + uid).once('value').then((dataSnapshot) => {
      this.loggedInUser.id = uid;
      this.loggedInUser.name = dataSnapshot.val().name || '';

      Object.keys(dataSnapshot.val().friend).forEach(id => {
        this.loggedInUser.friends.push(id)
      })

      if(this.isLocalStorageSupported) {
        this.localStorage.setItem("user", JSON.stringify(this.loggedInUser))
      }
    });
  }

  /* Returns the currently signed in user */
  getLoggedInUser() {
    if(this.isLocalStorageSupported) {
      return JSON.parse(this.localStorage.getItem("user"))
    }
    return null
  }

  remove() {
    this.localStorage.removeItem("user")
  }
}
