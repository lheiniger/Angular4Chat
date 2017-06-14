import {ChangeDetectorRef, Component, ElementRef, NgZone, OnInit, ViewChild} from '@angular/core';
import {Message} from './message';
import 'rxjs/add/operator/first';
import {ChatHandlerService} from "./chat-handler.service";
import {ChatCommunicationService} from "./chat-communication.service";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  constructor(private chatCommunication: ChatCommunicationService, private chatService: ChatHandlerService, private cdRef: ChangeDetectorRef, private zone: NgZone) {
  }

  @ViewChild('textInput')
  private textInput: ElementRef;

  @ViewChild('messagesDiv')
  private messagesDiv: ElementRef;

  name: string = '';
  text: string = '';
  connected: boolean;

  get messages(): Message[] {
    return this.chatService.getMessages();
  }

  get users(): string[] {
    return this.chatService.getUsers();
  }

  ngOnInit() {
    this.chatService.connected().subscribe(value => {
      if (this.connected && !value) {
        this.chatService.showWarning("Disconnected");
      }
      if (value) {
        this.afterChange(ChangeDetectionMethod.WaitForDetection, () => this.focusMessageField());
      }
      this.connected = value;
    });
    this.chatCommunication.messagesStream().subscribe(m => {
      const max = this.messagesDiv.nativeElement.scrollHeight - this.messagesDiv.nativeElement.offsetHeight;
      const current = this.messagesDiv.nativeElement.scrollTop;
      const isScolledDown: boolean = max == current;
      if (isScolledDown) {
        this.afterChange(ChangeDetectionMethod.WaitForDetection, () => this.messagesDiv.nativeElement.scrollTop = this.messagesDiv.nativeElement.scrollHeight);
      }
    });
  }

  connect() {
    if (!this.name) {
      return;
    }
    this.chatService.connect(this.name);
  }

  send() {
    if (!this.text) {
      return;
    }
    this.chatService.send(this.text);
    this.text = '';
    this.focusMessageField();
  }

  private focusMessageField() {
    if (this.textInput && this.textInput.nativeElement) {
      this.textInput.nativeElement.focus();
    }
  }

  /* Show different execute code after the next digest cycle */
  private afterChange(detectionType: ChangeDetectionMethod, methodToDelay: () => void) {
    switch (detectionType) {
      case ChangeDetectionMethod.ForceDetection:
        this.cdRef.detectChanges();
        methodToDelay();
        break;
      case ChangeDetectionMethod.WaitForDetection:
        this.zone.onMicrotaskEmpty.first().subscribe(() => methodToDelay());
        break;
      case ChangeDetectionMethod.SimpleDelay:
        setTimeout(() => methodToDelay(), 0);
        break;
      case ChangeDetectionMethod.None:
        methodToDelay();
        break;
    }
  }
}

enum ChangeDetectionMethod {
  ForceDetection,
  WaitForDetection,
  SimpleDelay,
  None
}
