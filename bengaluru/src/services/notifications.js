export class NotificationService {
    logSimulated(channel, recipient, message) {
        const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        console.log(`%c[Notification Queued]`, 'color: #00FFFF; font-weight: bold;');
        console.log(`Recipient: ${recipient}\nChannel: ${channel}\nTime: ${time}\nStatus: SIMULATED\nMessage: ${message}`);
    }
    sendWhatsApp(to, msg) { this.logSimulated('WhatsApp', to, msg); }
    sendSMS(to, msg) { this.logSimulated('SMS', to, msg); }
    sendEmail(to, msg) { this.logSimulated('Email', to, msg); }
    sendICCCWebhook(payload) { this.logSimulated('ICCC Webhook', 'Central Command', payload); }
}
