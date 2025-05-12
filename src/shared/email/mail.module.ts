import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { MailService } from './mail.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: configService.get<string>('BREVO_SMTP_HOST'),
          port: configService.get<number>('BREVO_SMTP_PORT'),
          secure: false,
          auth: {
            user: configService.get<string>('BREVO_SMTP_USER'),
            pass: configService.get<string>('BREVO_SMTP_KEY'),
          },
        },
        defaults: {
          from: `"${configService.get<string>('EMAIL_FROM_NAME')}" <${configService.get<string>('EMAIL_FROM_ADDRESS')}>`,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
