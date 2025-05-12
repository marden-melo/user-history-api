import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private readonly logger = new Logger('MailService');
  private readonly apiInstance: any;

  constructor(private readonly configService: ConfigService) {
    const SibApiV3Sdk = require('sib-api-v3-sdk');

    const defaultClient = SibApiV3Sdk.ApiClient.instance;
    const apiKey = defaultClient.authentications['api-key'];
    apiKey.apiKey = this.configService.get<string>('BREVO_API_KEY');

    this.apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetUrl = `${this.configService.get('APP_URL')}/reset-password?token=${token}`;

    const SibApiV3Sdk = require('sib-api-v3-sdk');
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.sender = {
      name: this.configService.get('EMAIL_FROM_NAME'),
      email: this.configService.get('EMAIL_FROM_ADDRESS'),
    };
    sendSmtpEmail.to = [{ email }];
    sendSmtpEmail.subject = 'Redefinição de Senha';
    sendSmtpEmail.htmlContent = `
  <div style="background-color: #f5f5f5; padding: 30px 0; font-family: Arial, sans-serif;">
    <table align="center" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.05); overflow: hidden;">
      <tr>
        <td style="padding: 40px 30px; text-align: center;">
          <h1 style="color: #333333; font-size: 24px; margin-bottom: 10px;">Redefinição de Senha</h1>
          <p style="color: #666666; font-size: 16px; line-height: 1.5;">
            Recebemos uma solicitação para redefinir a sua senha. Para continuar, clique no botão abaixo e escolha uma nova senha.
          </p>
          <div style="margin: 30px 0;">
            <a href="${resetUrl}" target="_blank" style="display: inline-block; background-color: #007bff; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 5px; font-weight: bold;">
              Redefinir Senha
            </a>
          </div>
          <p style="color: #999999; font-size: 14px;">
            O link é válido por 30 minutos. Se você não solicitou essa alteração, ignore este e-mail com segurança.
          </p>
        </td>
      </tr>
      <tr>
        <td style="background-color: #f0f0f0; padding: 20px; text-align: center; color: #999999; font-size: 12px;">
          &copy; ${new Date().getFullYear()} Sua Empresa. Todos os direitos reservados.
        </td>
      </tr>
    </table>
  </div>
`;

    try {
      await this.apiInstance.sendTransacEmail(sendSmtpEmail);
    } catch (error: any) {
      this.logger.error(
        `Erro ao enviar e-mail para ${email}: ${error.message}`,
        error.stack,
      );
      throw new Error(
        `Falha ao enviar e-mail de redefinição: ${error.message}`,
      );
    }
  }
}
