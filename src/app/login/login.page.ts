import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AngularFireAuth } from '@angular/fire/auth';
import { UserService} from "../services/user/user.service";

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {
  loginForm: FormGroup;
  currentUser: any;
  loadingIn: boolean;

  constructor(
    private router: Router,
    private alertCtrl: AlertController,
    public auth: AngularFireAuth,
    private userService: UserService
  ) {}

  ngOnInit() {
    this.auth.onAuthStateChanged((user) => {
      if (user) {
        this.router.navigateByUrl('/tabs');
        this.currentUser = user;
        this.userService.setLoggedInUser(user?.uid);
      }
    });
    this.loginForm = new FormGroup({
      login_email: new FormControl(null, {
        updateOn: 'blur',
        validators: Validators.required
      }),
      login_password: new FormControl(null, {
        updateOn: 'blur',
        validators: Validators.required
      })
    });
  }

  loginUser(credentials) {
    this.loadingIn = true;
    this.auth.signInWithEmailAndPassword(credentials.login_email, credentials.login_password)
      .then((user) => {
          this.router.navigateByUrl('/tabs');
          this.userService.setLoggedInUser(user.user.uid);
          this.loadingIn = false;
        },
        // tslint:disable-next-line:no-shadowed-variable
        async error => {
          this.loadingIn = false;
          const alert = await this.alertCtrl.create({
            message: error.message,
            buttons: [{text: 'OK', role: 'cancel'}]
          });
          await alert.present();
        });
  }
}
