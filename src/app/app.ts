import {Component, OnDestroy} from '@angular/core';
import Konva from 'konva';
import {ImageEditor} from './components/image-editor/image-editor';

@Component({
  selector: 'app-root',
  imports: [
    ImageEditor
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
}
