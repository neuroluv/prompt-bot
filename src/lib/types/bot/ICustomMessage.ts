export interface ICustomMessage {
  message: string;
  photos?: {
    url: string;
    type: 'video' | 'photo';
    caption?: string;
  }[];
  buttons?: {
    text: string;
    url: string;
  }[];
}
