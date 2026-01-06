import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryFailedError } from 'typeorm';
import { CreateContactUsDto } from './dto/create-contact-us.dto';
import { ContactUs } from './entities/contact-us.entity';
import { MailService } from '../../mail/mail.service';

@Injectable()
export class ContactUsService {
  constructor(
    @InjectRepository(ContactUs)
    private readonly contactUsRepository: Repository<ContactUs>,
    private readonly mailService: MailService,
  ) {}

  async create(createContactUsDto: CreateContactUsDto): Promise<ContactUs> {
    try {
      const sanitizedData = {
        name: this.sanitizeInput(createContactUsDto.name),
        email: createContactUsDto.email.trim().toLowerCase(),
        message: this.sanitizeInput(createContactUsDto.message),
      };

      const contactUs = this.contactUsRepository.create(sanitizedData);
      const savedContact = await this.contactUsRepository.save(contactUs);

      try {
        await this.mailService.sendContactUsEmail(
          sanitizedData.name,
          sanitizedData.email,
          sanitizedData.message,
        );
      } catch (mailError) {
        console.error('Failed to send contact us email:', mailError);
      }

      return savedContact;
    } catch (error) {
      if (error instanceof QueryFailedError) {
        throw new BadRequestException('Failed to save contact message. Please check your input.');
      }

      console.error('Error creating contact message:', error);
      throw new InternalServerErrorException(
        'An unexpected error occurred while processing your request',
      );
    }
  }

  /**
   * Get all contact messages (Admin only)
   * @returns Array of all contact messages ordered by creation date
   * @throws InternalServerErrorException if database operation fails
   */
  async findAll(): Promise<ContactUs[]> {
    try {
      const contactMessages = await this.contactUsRepository.find({
        order: { createdAt: 'DESC' },
      });

      return contactMessages;
    } catch (error) {
      throw new InternalServerErrorException(`Failed to retrieve contact messages ${error}`);
    }
  }

  /**
   * Get a specific contact message by ID
   * @param id - Contact message ID
   * @returns Contact message
   * @throws BadRequestException if ID is invalid
   * @throws NotFoundException if contact message not found
   * @throws InternalServerErrorException if database operation fails
   */
  async findOne(id: number): Promise<ContactUs> {
    // Validate ID
    if (!id || id <= 0 || !Number.isInteger(id)) {
      throw new BadRequestException('Invalid contact message ID');
    }

    try {
      const contactUs = await this.contactUsRepository.findOne({
        where: { id },
      });

      if (!contactUs) {
        throw new NotFoundException(`Contact message with ID ${id} not found`);
      }

      return contactUs;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to retrieve contact message');
    }
  }

  /**
   * Delete a contact message (Admin only)
   * @param id - Contact message ID
   * @throws BadRequestException if ID is invalid
   * @throws NotFoundException if contact message not found
   * @throws InternalServerErrorException if database operation fails
   */
  async remove(id: number): Promise<void> {
    const contactUs = await this.findOne(id);

    try {
      await this.contactUsRepository.remove(contactUs);
    } catch (error) {
      throw new InternalServerErrorException(`Failed to delete contact message ${error}`);
    }
  }

  /**
   * Sanitize input to prevent XSS attacks
   * @param input - Raw input string
   * @returns Sanitized string
   */
  private sanitizeInput(input: string): string {
    if (!input) return input;

    return input
      .trim()
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  }
}
