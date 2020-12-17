import { Component, OnInit } from '@angular/core';
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {Router} from "@angular/router";
import {AlertController} from "@ionic/angular";
import {AngularFireAuth} from "@angular/fire/auth";
import {UserService} from "../services/user/user.service";

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
})
export class RegisterPage implements OnInit {
  signUpForm: FormGroup;
  currentUser: any;
  loadingUp: boolean;

  constructor(
    private router: Router,
    private alertCtrl: AlertController,
    public auth: AngularFireAuth,
    private userService: UserService
  ) {}

  ngOnInit() {
    this.auth.onAuthStateChanged((user) => {
      if (user) {
        this.userService.setLoggedInUser(user.uid);
        this.router.navigateByUrl('/tabs');
        this.currentUser = user;
      }
    });

    this.signUpForm = new FormGroup({
      signup_email: new FormControl(null, {
        updateOn: 'blur',
        validators: Validators.required
      }),
      signup_password: new FormControl(null, {
        updateOn: 'blur',
        validators: Validators.required
      }),
      signup_full_name: new FormControl(null, {
        updateOn: 'blur',
        validators: Validators.required
      }),
    });
  }

  signUpUser(credentials) {
    this.loadingUp = true;
    this.auth.createUserWithEmailAndPassword(credentials.signup_email, credentials.signup_password)
      .then((userCredential) => {
          this.userService.setLoggedInUser(userCredential.user.uid);
          this.userService.create(userCredential.user, credentials.signup_full_name);
          this.router.navigateByUrl('/welcome');
          this.loadingUp = false;
        },
        async error => {
          this.loadingUp = false;
          const alert = await this.alertCtrl.create({
            message: error.message,
            buttons: [{text: 'OK', role: 'cancel'}]
          });
          await alert.present();
        });
  }
}
