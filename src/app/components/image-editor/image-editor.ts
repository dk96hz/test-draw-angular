import {Component, effect, signal, viewChild} from '@angular/core';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-image-editor',
  imports: [
    FormsModule
  ],
  templateUrl: './image-editor.html',
  styleUrl: './image-editor.css',
})
export class ImageEditor {
  canvas = viewChild<any>('canvas');
  fileInput = viewChild<HTMLInputElement>('fileInput');

  imageLoaded = signal(false);
  currentTool = signal<'draw' | 'erase'>('draw');
  currentColor = signal('#000000');
  brushSize = signal(5);

  private isDrawing = false;
  private uploadedImage: HTMLImageElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;

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

  constructor() {
    // Effect to initialize canvas context when canvas is available
    effect(() => {
      const canvasEl: any = this.canvas()?.nativeElement;
      if (canvasEl) {
        this.ctx = canvasEl.getContext('2d');
      }
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file) {
      const reader = new FileReader();

      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          this.uploadedImage = img;
          this.setupCanvas(img);
          this.imageLoaded.set(true);
        };
        img.src = e.target?.result as string;
      };

      reader.readAsDataURL(file);
    }
  }

  setupCanvas(img: HTMLImageElement) {
    console.log(img)
    const canvasEl = this.canvas()?.nativeElement;
    console.log(canvasEl);
    if (!canvasEl || !this.ctx) return;

    const maxWidth = 1200;
    const maxHeight = 800;

    let width = img.width;
    let height = img.height;

    // Scale down if image is too large
    if (width > maxWidth) {
      height = (height * maxWidth) / width;
      width = maxWidth;
    }

    if (height > maxHeight) {
      width = (width * maxHeight) / height;
      height = maxHeight;
    }

    canvasEl.width = width;
    canvasEl.height = height;

    // Draw the uploaded image
    this.ctx.drawImage(img, 0, 0, width, height);
  }

  startDrawing(event: MouseEvent | TouchEvent) {
    if (!this.ctx) return;

    this.isDrawing = true;
    const pos = this.getMousePos(event);

    this.ctx.beginPath();
    this.ctx.moveTo(pos.x, pos.y);
  }

  draw(event: MouseEvent | TouchEvent) {
    if (!this.isDrawing || !this.ctx) return;

    event.preventDefault();
    const pos = this.getMousePos(event);

    this.ctx.lineWidth = this.brushSize();
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    if (this.currentTool() === 'draw') {
      this.ctx.globalCompositeOperation = 'source-over';
      this.ctx.strokeStyle = this.currentColor();
    } else {
      this.ctx.globalCompositeOperation = 'destination-out';
    }

    this.ctx.lineTo(pos.x, pos.y);
    this.ctx.stroke();
    this.ctx.beginPath();
    this.ctx.moveTo(pos.x, pos.y);
  }

  stopDrawing() {
    if (!this.ctx) return;

    this.isDrawing = false;
    this.ctx.beginPath();
  }

  getMousePos(event: MouseEvent | TouchEvent): { x: number; y: number } {
    const canvasEl = this.canvas()?.nativeElement;
    if (!canvasEl) return {x: 0, y: 0};

    const rect = canvasEl.getBoundingClientRect();

    let clientX: number, clientY: number;

    if (event instanceof MouseEvent) {
      clientX = event.clientX;
      clientY = event.clientY;
    } else {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }

  clearCanvas() {
    if (!this.uploadedImage || !this.ctx) return;

    const canvasEl = this.canvas()?.nativeElement;
    if (!canvasEl) return;

    this.ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
    this.ctx.drawImage(this.uploadedImage, 0, 0, canvasEl.width, canvasEl.height);
  }

  downloadImage() {
    const canvasEl = this.canvas()?.nativeElement;
    if (!canvasEl) return;

    canvasEl.toBlob((blob: any) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = 'edited-image.png';
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
      }
    });
  }

  resetEditor() {
    this.imageLoaded.set(false);
    this.uploadedImage = null;
    this.currentTool.set('draw');
    this.currentColor.set('#000000');
    this.brushSize.set(5);

    const fileInputEl = this.fileInput();
    if (fileInputEl) {
      fileInputEl.value = '';
    }
  }
}
