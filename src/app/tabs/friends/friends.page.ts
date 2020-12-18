import {Component, OnInit} from '@angular/core';
import {UserService} from "../../services/user/user.service";
import {AngularFireDatabase} from "@angular/fire/database";
import {User} from "../../services/user/user";
import {AlertController, ToastController} from "@ionic/angular";

@Component({
  selector: 'app-friends',
  templateUrl: './friends.page.html',
  styleUrls: ['./friends.page.scss'],
})
export class FriendsPage implements OnInit {
  uid: string;
  friendId: any[];
  friends: User[] = [];
  filteredFriend: User[] = [];

  constructor(
    private alertCtrl: AlertController,
    private userService: UserService,
    private db: AngularFireDatabase,
    private toastController: ToastController
  ) {
  }

  ionViewWillEnter() {
    this.uid = this.userService.getLoggedInUser().id;
    this.fetchFriend();
  }

  fetchFriend() {
    this.friendId = [];
    this.friends = [];
    this.db.list('users/' + this.uid + '/friend').query.once('value')
      .then(data => {
        Object.keys(data.val()).forEach(singleFriend => {
          this.friendId.push(singleFriend)
        })

        this.friendId.forEach((singleId: string) => {
          this.db.list('users/' + singleId).valueChanges()
            .subscribe((singleUser) => {
              if(singleId !== '-') {
                this.friends.push({
                  id: singleId,
                  name: singleUser[1].toString()
                })
              }
            })
        })

        this.filteredFriend = this.friends

        // this.db.list('/users').query.orderByChild('name').startAt(val.toUpperCase()).endAt(val.toLowerCase() + '\uf8ff').once('value')
        //   .then((unformattedData) => {
        //     unformattedData.forEach((singleData) => {
        //       if (this.friendId.includes(singleData.key)) {
        //         this.friends.push({
        //           id: singleData.key,
        //           ...singleData.val()
        //         })
        //       }
        //     })
        //   })
      })
  }

  searchFriend(val: string) {
    this.filteredFriend = this.friends.filter(singleFriend => {
      return singleFriend.name.toLowerCase().includes(val.toLowerCase())
    })
  }

  deleteFriends(idFriend: string) {
    this.db.list('/users/' + this.uid + '/friend/' + idFriend).remove().then(() => {
      this.presentToast()
      this.fetchFriend()
    })
  }

  onPress(idFriend, friendName) {
    this.presentAlert(idFriend, friendName)
  }

  async presentAlert(idFriend, friendName) {
    const alert = await this.alertCtrl.create({
      header: 'Delete Friend',
      message: 'Are you sure to delete ' + friendName + '? This action can\'t be undone',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          handler: () => this.deleteFriends(idFriend)
        }
      ]
    });
    await alert.present();
  }

  async presentToast() {
    const toast = await this.toastController.create({
      message: 'Friend Deleted',
      duration: 3000,
      color: 'warning'
    });
    await toast.present();
  }

  ngOnInit() {
  }
}
