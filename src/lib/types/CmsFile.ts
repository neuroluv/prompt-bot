export interface CmsFile {
  id: string;
  storage: string;
  filename_disk: string;
  filename_download: string;
  title: string;
  type: string;
  folder: string;
  uploaded_by: string;
  created_on: string;
  modified_by: string;
  modified_on: string;
  charset: string;
  filesize: string;
  width: number;
  height: number;
  duration: number;
  embed: string;
  description: string;
  location: string;
  tags: JSON;
  metadata: JSON;
  focal_point_x: number;
  focal_point_y: number;
  tus_id: string;
  tus_data: JSON;
  uploaded_on: string;
}
