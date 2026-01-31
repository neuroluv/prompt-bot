export interface IFile {
  id: string;
  storage: string;
  filename_disk: string;
  filename_download: string;
  title: string;
  type: string;
  folder: string;
  uploaded_by: string;
  created_on: string;
  uploaded_on: string;
  modified_by: string | null;
  modified_on: string | null;
  charset: string | null;
  filesize: string;
  width: number;
  height: number;
  duration: number | null;
  embed: string | null;
  description: string | null;
  location?: string | null;
  tags: object | null;
  metadata: object | null;
  focal_point_x: number | null;
  focal_point_y: number | null;
  tus_id: string | null;
  tus_data: object | null;
}
