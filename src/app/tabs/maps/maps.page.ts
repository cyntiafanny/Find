import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {UserService} from "../../services/user/user.service";
import {AngularFireDatabase} from "@angular/fire/database";
import {AngularFireAuth} from "@angular/fire/auth";
import {Router} from "@angular/router";
import {User} from "../../services/user/user";
import {HttpClient} from "@angular/common/http";
import {Location} from "../../services/location/location";
import {ToastController} from "@ionic/angular";

declare var google: any;

@Component({
  selector: 'app-maps',
  templateUrl: './maps.page.html',
  styleUrls: ['./maps.page.scss'],
})
export class MapsPage implements OnInit {
  map: any;
  user: User;
  uid: string;
  friendsId: string[] = [];
  friendsLocation: Location[] = [];
  currentLocation: string = "Location not detected"
  currentLatitude: number = -6.256081;
  currentLongitude: number = 106.618755;
  automaticUpdate: any;
  @ViewChild('map', {read: ElementRef, static: false}) mapRef: ElementRef;

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
    this.auth.onAuthStateChanged((user) => {
      if (!user) {
        this.router.navigateByUrl('/login');
        return;
      } else {
        this.userService.setLoggedInUser(user.uid);
        this.uid = user.uid

        this.db.object('/location/' + this.uid).query.once('value')
          .then(data => {
            let currId = "";
            Object.keys(data.val()).forEach(locId => {
              currId = locId;
            });
            if (currId === "-") {

            }
            if (currId !== "-") {
              this.currentLongitude = data.val()[currId].longitude;
              this.currentLatitude = data.val()[currId].latitude;
              this.currentLocation = data.val()[currId].location;
            }
          }).then(() => this.initMap())
      }
    });
  }

  ionViewWillEnter() {
    this.auth.onAuthStateChanged((user) => {
        if (user) {
          this.initMap()
          this.fetchFriendLocation()
        }
      }
    )
  }

  fetchFriendLocation() {
    this.friendsId = [];
    this.friendsLocation = []

    this.db.list('users/' + this.uid + '/friend').query.once('value')
      .then(data => {
        Object.keys(data.val()).forEach(singleFriend => {
          if (singleFriend !== "-") {
            this.friendsId.push(singleFriend)
          }
        })

        this.friendsId.forEach((singleId: string) => {
          this.db.list('users/' + singleId).valueChanges()
            .subscribe((singleUser) => {
              if (singleId !== '-') {
                this.db.object('/location/' + singleId).query.once('value')
                  .then(data => {
                    let currId = "";
                    Object.keys(data.val()).forEach(locId => {
                      currId = locId;
                    });
                    if (currId !== "-") {
                      this.friendsLocation.push({
                        id: currId,
                        user: singleUser[4].toString(),
                        longitude: data.val()[currId].longitude,
                        latitude: data.val()[currId].latitude,
                        name: data.val()[currId].location,
                        dateTime: data.val()[currId].time,
                      })
                    }
                  }).then(() => {
                  this.makeFriendsMark()
                })
              }
            })
        })
      })
  }

  makeFriendsMark() {
    this.friendsLocation.forEach((singleFriend) => {
      const location = new google.maps.LatLng(singleFriend.latitude, singleFriend.longitude);

      let marker = new google.maps.Marker({
        position: location,
        map: this.map,
      });

      let content = "<h5><b>" + singleFriend.user + "</b></h5><p>" + singleFriend.name + "</p>"
      let infoWindow = new google.maps.InfoWindow({
        content: content
      });
      google.maps.event.addListener(marker, 'click', () => {
        infoWindow.open(this.map, marker);
      });
    })
  }

  initMap() {
    const location = new google.maps.LatLng(this.currentLatitude, this.currentLongitude);
    const options = {
      center: location,
      zoom: 10,
      disableDefaultUI: true
    };

    this.map = new google.maps.Map(this.mapRef.nativeElement, options);

    let marker = new google.maps.Marker({
      position: options.center,
      map: this.map,
    });

    let content = "<h5><b>Your location</b></h5><p>" + this.currentLocation + "</p>"
    let infoWindow = new google.maps.InfoWindow({
      content: content
    });
    google.maps.event.addListener(marker, 'click', () => {
      infoWindow.open(this.map, marker);
    });

    this.automaticUpdate = setInterval(() => {
      navigator.geolocation.getCurrentPosition(() => {
        this.goToCenter();
        this.checkIn();
      })
    }, 600000);
  }

  goToCenter() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position: Position) => {
        this.currentLatitude = position.coords.latitude
        this.currentLongitude = position.coords.longitude

        let url = "https://maps.googleapis.com/maps/api/geocode/json?latlng=" + this.currentLatitude + "," + this.currentLongitude + "&key=AIzaSyDehuZ6WNyD6N-U9FT3R7ckDTQdQgK4JCE"
        this.http.get(url).subscribe(
          (data: any) => {
            this.currentLocation = data.results[0].formatted_address;
          })
        this.initMap();
        this.makeFriendsMark()
      })
    }
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

  checkIn() {
    this.db.list('location/' + this.uid).push({
      latitude: this.currentLatitude,
      longitude: this.currentLongitude,
      location: this.currentLocation,
      time: this.formatDate()
    }).then(() => this.presentToast())
  }

  async presentToast() {
    const toast = await this.toastController.create({
      message: 'Check in Success',
      duration: 3000,
      color: 'warning'
    });
    await toast.present();
  }
}
