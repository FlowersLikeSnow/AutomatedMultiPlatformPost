import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import qiniu from 'qiniu'
import sharp from 'sharp'
import { nanoid } from 'nanoid'

@Injectable()
export class UploadService {
  private cfg: qiniu.conf.Config
  private mac: qiniu.auth.digest.Mac
  private bucket: string
  private domain: string
  private folder: string

  constructor(private configService: ConfigService) {
    this.bucket = this.configService.get<string>('QINIU_BUCKET', '')
    this.domain = this.configService.get<string>('QINIU_DOMAIN', '')
    this.folder = this.configService.get<string>('QINIU_FOLDER', 'avatars')

    this.cfg = new qiniu.conf.Config()
    const zone = this.configService.get<string>('QINIU_ZONE', 'z2')
    const zoneMap: Record<string, any> = { z0: qiniu.zone.Zone_z0, z1: qiniu.zone.Zone_z1, z2: qiniu.zone.Zone_z2 }
    this.cfg.zone = zoneMap[zone] || qiniu.zone.Zone_z2
    this.cfg.useHttpsDomain = true

    this.mac = new qiniu.auth.digest.Mac(
      this.configService.get<string>('QINIU_ACCESS_KEY', ''),
      this.configService.get<string>('QINIU_SECRET_KEY', '')
    )
  }

  private getToken(): string {
    const putPolicy = new qiniu.rs.PutPolicy({ scope: this.bucket })
    return putPolicy.uploadToken(this.mac)
  }

  async uploadAvatar(buffer: Buffer): Promise<string> {
    // Compress avatar
    const compressed = await sharp(buffer)
      .resize(256, 256, { fit: 'inside', withoutEnlargement: true })
      .toFormat('webp', { quality: 85 })
      .toBuffer()

    const fileName = `${this.folder}/${nanoid(12)}.webp`
    const token = this.getToken()
    const formUploader = new qiniu.form_up.FormUploader(this.cfg)
    const putExtra = new qiniu.form_up.PutExtra()

    return new Promise((resolve, reject) => {
      formUploader.put(token, fileName, compressed, putExtra, (err, _body, info) => {
        if (err) { reject(err); return }
        if (info.statusCode === 200) {
          resolve(`http://${this.domain}/${fileName}`)
        } else {
          reject(new Error(`Upload failed: ${info.statusCode}`))
        }
      })
    })
  }
}
