import {Component, effect, signal, viewChild} from '@angular/core';
import {FormsModule} from '@angular/forms';
import SignaturePad from 'signature_pad';

@Component({
  selector: 'app-image-editor',
  imports: [
    FormsModule
  ],
  templateUrl: './image-editor.html',
  styleUrl: './image-editor.css',
})
export class ImageEditor {
  signatureCanvas = viewChild<any>('signatureCanvas');
  fileInput = viewChild<HTMLInputElement>('fileInput');

  //4:3

  private minWidth = 300;
  private maxWidth = 300;

  imageLoaded = signal(false);
  currentTool = signal<'draw' | 'erase'>('draw');
  currentColor = signal('#000000');
  brushSize = signal(5);

  private uploadedImage: HTMLImageElement | null = null;

  predefinedColors = [
    '#000000',
    '#FF0000',
    '#00FF00',
    '#0000FF',
    '#FFFF00',
    '#FF00FF',
    '#00FFFF',
    '#FFFFFF'
  ];
  protected signaturePad!: SignaturePad;


  private resizeCanvas() {
    if (!this.signatureCanvas()) return;
    const canvas = this.signatureCanvas().nativeElement;
    const ctx = canvas.getContext("2d");
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    ctx.scale(ratio, ratio);
  }

  updateColor(color: string) {
    console.log(color);
    this.signaturePad.penColor = color;
  }

  constructor() {
    effect(() => {
      if (!this.signatureCanvas()) return;
      console.log(this.signaturePad);
    });

    // window.addEventListener("resize", this.resizeCanvas.bind(this));
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file) {
      const reader = new FileReader();

      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Get the original image dimensions
          const originalWidth = img.naturalWidth;
          const originalHeight = img.naturalHeight;

          // Get screen/container constraints (leaving some margin)
          const maxWidth = window.innerWidth * 0.9;
          const maxHeight = window.innerHeight * 0.8;

          // Calculate scaling factor
          let scale = 1;
          if (originalWidth > maxWidth || originalHeight > maxHeight) {
            const scaleWidth = maxWidth / originalWidth;
            const scaleHeight = maxHeight / originalHeight;
            scale = Math.min(scaleWidth, scaleHeight);
          }

          // Calculate final dimensions
          const finalWidth = Math.floor(originalWidth * scale);
          const finalHeight = Math.floor(originalHeight * scale);

          // Get canvas and set dimensions
          const canvas = this.signatureCanvas().nativeElement;
          canvas.width = finalWidth;
          canvas.height = finalHeight;

          // Set the image as CSS background
          canvas.style.backgroundImage = `url(${e.target?.result})`;
          canvas.style.backgroundSize = 'contain';
          canvas.style.backgroundRepeat = 'no-repeat';
          canvas.style.backgroundPosition = 'center';


          const ctx = canvas.getContext("2d");
          const ratio = Math.max(window.devicePixelRatio || 1, 1);
          canvas.width = canvas.offsetWidth * ratio;
          canvas.height = canvas.offsetHeight * ratio;
          ctx.scale(ratio, ratio);


          // Initialize SignaturePad with transparent background
          this.signaturePad = new SignaturePad(canvas, {
            backgroundColor: 'rgba(0, 0, 0, 0)' // Transparent
          });

          this.uploadedImage = img;
          this.imageLoaded.set(true);
        };
        img.src = e.target?.result as string;
      };

      reader.readAsDataURL(file);
    }
  }


  clickDownloadImage() {
    const canvas = this.signatureCanvas().nativeElement;

    // Create a temporary canvas to combine both layers
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');

    if (tempCtx && this.uploadedImage) {
      // Draw the background image first
      tempCtx.drawImage(this.uploadedImage, 0, 0, canvas.width, canvas.height);

      // Draw the signature/drawing canvas on top
      tempCtx.drawImage(canvas, 0, 0);

      // Convert to data URL or blob
      const finalImage = tempCanvas.toDataURL('image/png');

      // Download or use the combined image
      this.downloadImage(finalImage);
    }
  }

  downloadImage(dataUrl: string) {
    const link = document.createElement('a');
    link.download = 'annotated-image.png';
    link.href = dataUrl;
    link.click();
  }

  resetEditor() {
    this.signaturePad.clear();
  }
}
