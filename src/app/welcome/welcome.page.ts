import {Component, OnInit} from '@angular/core';
import {UserService} from "../services/user/user.service";
import {AngularFireDatabase} from "@angular/fire/database";
import {AngularFireAuth} from "@angular/fire/auth";
import {Router} from "@angular/router";
import {HttpClient} from "@angular/common/http";
import {ToastController} from "@ionic/angular";

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.page.html',
  styleUrls: ['./welcome.page.scss'],
})
export class WelcomePage implements OnInit {
  uid: string;
  currentLatitude: number = -6.256081;
  currentLongitude: number = 106.618755;
  currentLocation: string = "Location Undefined"
  loading: boolean = false;

  constructor(
    private userService: UserService,
    private db: AngularFireDatabase,
    public auth: AngularFireAuth,
    private router: Router,
    private http: HttpClient,
    private toastController: ToastController
  ) {
  }

  ngOnInit() {
    this.uid = this.userService.getLoggedInUser().id;
  }

  ionViewWillEnter() {
    this.loading = false;
  }

  createCheckIn() {
    this.loading = true;
    navigator.geolocation.getCurrentPosition(() => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position: Position) => {
          this.currentLatitude = position.coords.latitude
          this.currentLongitude = position.coords.longitude

          let url = "https://maps.googleapis.com/maps/api/geocode/json?latlng=" + this.currentLatitude + "," + this.currentLongitude + "&key=AIzaSyDehuZ6WNyD6N-U9FT3R7ckDTQdQgK4JCE"
          this.http.get(url).subscribe(
            (data: any) => {
              this.currentLocation = data.results[0].formatted_address;

              this.db.list('location/' + this.uid).push({
                latitude: this.currentLatitude,
                longitude: this.currentLongitude,
                location: this.currentLocation,
                time: this.formatDate()
              }).then(() => {
                this.loading = false
                this.presentToast()
                this.router.navigateByUrl('/tabs')
              })
            })

        })
      }
    })
  }

  async presentToast() {
    const toast = await this.toastController.create({
      message: 'Check in Success',
      duration: 3000,
      color: 'warning'
    });
    await toast.present();
  }

  formatDate() {
    const today = new Date()

    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    let day = days[today.getDay()];
    let date = today.getDate();
    let month = months[today.getMonth()];
    let year = today.getFullYear();

    let time = " (" + today.getHours() + ":" + today.getMinutes() + ")"

    return day + ", " + date + " " + month + " " + year + time;
  }

  skip() {
    this.router.navigateByUrl('/tabs')
  }

}
