const MAX_PX = 1200
const QUALITE = 0.82

export async function compresserImage(fichier: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.onload = () => {
      let { width, height } = img
      if (width > MAX_PX || height > MAX_PX) {
        if (width > height) { height = Math.round((height / width) * MAX_PX); width = MAX_PX }
        else { width = Math.round((width / height) * MAX_PX); height = MAX_PX }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) { resolve(fichier); return }
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        blob => {
          if (!blob) { resolve(fichier); return }
          const nomSansExt = fichier.name.replace(/\.[^.]+$/, '')
          resolve(new File([blob], `${nomSansExt}.jpg`, { type: 'image/jpeg' }))
        },
        'image/jpeg',
        QUALITE,
      )
    }
    img.onerror = () => resolve(fichier)
    img.src = URL.createObjectURL(fichier)
  })
}
