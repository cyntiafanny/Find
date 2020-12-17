import {Component, OnInit} from '@angular/core';
import {ToastController} from "@ionic/angular";
import {UserService} from "../../../services/user/user.service";
import {AngularFireDatabase} from "@angular/fire/database";

@Component({
  selector: 'app-add-friends',
  templateUrl: './add-friends.page.html',
  styleUrls: ['./add-friends.page.scss'],
})
export class AddFriendsPage implements OnInit {
  result: any[] = [];
  friendId: string[];
  uid: string;
  allUser: any[] = [];

  constructor(
    private userService: UserService,
    private db: AngularFireDatabase,
    private toastController: ToastController
  ) {
  }

  ngOnInit() {
  }

  ionViewWillEnter() {
    this.uid = this.userService.getLoggedInUser().id;
    this.fetchFriend()
    this.fetchUser()
  }

  fetchFriend() {
    this.friendId = [];
    this.db.list('users/' + this.uid + '/friend').query.once('value')
      .then(data => {
        Object.keys(data.val()).forEach(singleFriend => {
          this.friendId.push(singleFriend)
        })
      })
  }

  addFriend(newFriendId: string, idx: number) {
    this.db.database.ref().child('users/' + this.uid + '/friend').child(`${newFriendId}`)
      .set(true).then(() => {
      this.presentToast();
      this.allUser[idx-1].status = true;
      })
  }

  fetchUser() {
    this.allUser = []

    this.db.object('/users').query.once('value')
      .then(data => {
        let idx = 1;
        Object.keys(data.val()).forEach(userid => {
          let friendStatus = false;
          if (this.friendId.includes(userid)) {
            friendStatus = true;
          }
          if (userid !== this.uid) {
            this.allUser.push({
              id: userid,
              idx: idx,
              name: data.val()[userid].name,
              status: friendStatus
            });
            idx++;
          }
        });
      });
    // this.db.list('users').query.once('value')
    //   .then(data => {
    //       Object.keys(data.val()).forEach((singleUser: any) => {
    //         let friendStatus = false;
    //         if (this.friendId.includes(singleUser.key)) {
    //           friendStatus = true;
    //         }
    //         this.allUser.push({
    //           id: singleUser,
    //           name: singleUser.name
    //         })
    //       })
    //     }
    //   )
  }

  search(val: string) {
    this.result = [];

    if (val != "") {
      this.result = this.allUser.filter(singleUser => {
        return singleUser.name.toLowerCase().includes(val.toLowerCase())
      })
    }
  }

  async presentToast() {
    const toast = await this.toastController.create({
      message: 'User Added',
      duration: 3000,
      color: 'warning'
    });
    await toast.present();
  }

}
