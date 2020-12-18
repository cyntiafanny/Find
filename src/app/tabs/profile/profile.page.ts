import { Component, OnInit } from '@angular/core';
import {User} from "../../services/user/user";
import {AlertController, ToastController} from "@ionic/angular";
import {UserService} from "../../services/user/user.service";
import {AngularFireDatabase} from "@angular/fire/database";
import {AngularFireAuth} from "@angular/fire/auth";
import {Router} from "@angular/router";
import {Location} from "../../services/location/location";

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage implements OnInit {
  currentUser: User;
  uid: string;
  locationHistory: Location[] = [];
  loading: boolean;
  isHistoryOpen: boolean;
  isImpressionopen: boolean;

  constructor(
    public auth: AngularFireAuth,
    private router: Router,
    private alertCtrl: AlertController,
    private userService: UserService,
    private db: AngularFireDatabase,
    private toastController: ToastController
  ) { }

  ngOnInit() {
    this.currentUser = this.userService.getLoggedInUser();
  }

  ionViewWillEnter() {
    this.currentUser = this.userService.getLoggedInUser();
    this.isImpressionopen = false;
    this.isHistoryOpen = false;
    this.fetchHistory()
  }

  logout() {
    this.loading = true;

    return this.auth.signOut().then(() => {
      this.userService.remove()
      this.router.navigateByUrl('/login');
      this.loading = false;
    }),
      async error => {
        this.loading = false;
        const alert = await this.alertCtrl.create({
          message: error.message,
          buttons: [{text: 'OK', role: 'cancel'}]
        });
        await alert.present();
      }
  }

  tabOnClick(state: string) {
    if(state === "history") {
      this.isHistoryOpen = !this.isHistoryOpen;
    }
    else {
      this.isImpressionopen = !this.isImpressionopen;
    }
  }

  fetchHistory() {
    this.locationHistory = [];

    this.db.object('location/' + this.currentUser.id).query.once('value')
      .then(data => {
        Object.keys(data.val()).forEach((singleLocation: string) => {
          if(singleLocation !== "-") {
            this.locationHistory.push({
              id: singleLocation,
              name: data.val()[singleLocation].location,
              longitude: data.val()[singleLocation].longitude,
              latitude: data.val()[singleLocation].latitude,
              dateTime: data.val()[singleLocation].time
            });
          }
        });
      });
  }

  deleteHistory(idHistory: string) {
    this.db.list('/location/' + this.currentUser.id + '/' + idHistory).remove().then(() => {
      this.presentToast()
      this.fetchHistory()
    })
  }

  onPress(idHistory) {
    this.presentAlert(idHistory)
  }

  async presentAlert(idHistory) {
    const alert = await this.alertCtrl.create({
      header: 'Delete History',
      message: 'Are you sure to delete this history? This action can\'t be undone',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          handler: () => this.deleteHistory(idHistory)
        }
      ]
    });
    await alert.present();
  }

  async presentToast() {
    const toast = await this.toastController.create({
      message: 'History Deleted',
      duration: 3000,
      color: 'warning'
    });
    await toast.present();
  }
}
