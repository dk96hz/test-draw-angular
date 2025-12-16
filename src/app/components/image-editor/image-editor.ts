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
  private maxWidth = 400;

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
    this.currentColor.set(color);
    this.signaturePad.penColor = color;
  }

  updateBrushSize(size: number) {
    this.brushSize.set(size);
    this.signaturePad.minWidth = size;
    this.signaturePad.maxWidth = size;
  }

  updateMode(mode: "draw" | "erase") {
    console.log(this.signaturePad.compositeOperation);
    this.currentTool.set(mode);
    if (mode === "draw") {
      this.signaturePad.compositeOperation = "source-over";
      this.signaturePad.penColor = this.currentColor();
    } else {
      this.signaturePad.compositeOperation = "destination-out";
    }
  }

  undo() {
    const data = this.signaturePad.toData();
    if (data) {
      data.pop();
      this.signaturePad.fromData(data);
    }
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
          const aspectRatio = originalWidth / originalHeight;

          // Get device pixel ratio for high DPI screens
          const ratio = Math.max(window.devicePixelRatio || 1, 1);

          // Define constraints
          const minWidth = 100;
          const maxWidth = 400;
          const maxScreenWidth = window.innerWidth * 0.9;
          const maxScreenHeight = window.innerHeight * 0.8;

          // Calculate target width considering all constraints
          let targetWidth = originalWidth;

          // Apply screen constraints
          if (originalWidth > maxScreenWidth || originalHeight > maxScreenHeight) {
            const scaleWidth = maxScreenWidth / originalWidth;
            const scaleHeight = maxScreenHeight / originalHeight;
            const scale = Math.min(scaleWidth, scaleHeight);
            targetWidth = originalWidth * scale;
          }

          // Apply min/max constraints
          targetWidth = Math.max(minWidth, Math.min(maxWidth, targetWidth));

          // Calculate CSS dimensions (what the user sees)
          const cssWidth = Math.floor(targetWidth);
          const cssHeight = Math.floor(targetWidth / aspectRatio);

          // Calculate actual canvas dimensions (accounting for DPI)
          const canvasWidth = cssWidth * ratio;
          const canvasHeight = cssHeight * ratio;

          // Get canvas and set dimensions
          const canvas = this.signatureCanvas().nativeElement;

          // Set CSS size (display size)
          canvas.style.width = `${cssWidth}px`;
          canvas.style.height = `${cssHeight}px`;

          // Set actual canvas size (for high DPI)
          canvas.width = canvasWidth;
          canvas.height = canvasHeight;

          // Scale the context to account for DPI
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.scale(ratio, ratio);
          }

          // Set the image as CSS background (it will scale automatically)
          canvas.style.backgroundImage = `url(${e.target?.result})`;
          canvas.style.backgroundSize = 'cover';
          canvas.style.backgroundRepeat = 'no-repeat';
          canvas.style.backgroundPosition = 'center';

          // Initialize SignaturePad with transparent background
          this.signaturePad = new SignaturePad(canvas, {
            backgroundColor: 'rgba(0, 0, 0, 0)'
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
    if (!this.uploadedImage) return;

    const canvas = this.signatureCanvas().nativeElement;
    const ratio = Math.max(window.devicePixelRatio || 1, 1);

    // Get the original image dimensions
    const originalWidth = this.uploadedImage.naturalWidth;
    const originalHeight = this.uploadedImage.naturalHeight;

    // Get the current canvas CSS dimensions
    const cssWidth = canvas.offsetWidth;
    const cssHeight = canvas.offsetHeight;

    // Calculate the scale factor between original and display size
    const scaleX = originalWidth / cssWidth;
    const scaleY = originalHeight / cssHeight;

    // Create a temporary canvas at original image size
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = originalWidth;
    tempCanvas.height = originalHeight;

    const tempCtx = tempCanvas.getContext('2d');

    if (tempCtx) {
      // Draw the original image at full resolution
      tempCtx.drawImage(this.uploadedImage, 0, 0, originalWidth, originalHeight);

      // Scale the context to match the original image size
      tempCtx.scale(scaleX, scaleY);

      // Draw the signature/drawing canvas on top (it will be scaled up automatically)
      tempCtx.drawImage(canvas, 0, 0, cssWidth, cssHeight);

      // Convert to data URL with maximum quality
      const finalImage = tempCanvas.toDataURL('image/png');

      // Download the combined image
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
