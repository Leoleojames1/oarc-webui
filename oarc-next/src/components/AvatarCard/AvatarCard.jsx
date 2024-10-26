import React, { useState, useRef } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Settings } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function AvatarCard() {
  const [avatarSource, setAvatarSource] = useState('/placeholder.svg?height=200&width=200')
  const [avatarType, setAvatarType] = useState('image')
  const [avatarName, setAvatarName] = useState('')
  const [lipSyncModel, setLipSyncModel] = useState('MuseTalk')
  const [lipSyncImage, setLipSyncImage] = useState(null)
  const fileInputRef = useRef(null)

  const handleFileInput = (e) => {
    const file = e.target.files[0]
    if (file) {
      setAvatarSource(URL.createObjectURL(file))
      setAvatarType(file.type.startsWith('image/') ? 'image' : 'video')
    }
  }

  const handleLipSyncImageInput = (e) => {
    const file = e.target.files[0]
    if (file && file.type.startsWith('image/')) {
      setLipSyncImage(URL.createObjectURL(file))
    }
  }

  return (
    <Card className="w-full h-full bg-gray-800 text-green-400 relative overflow-hidden">
      <CardContent className="flex flex-col items-center justify-center h-full p-2">
        <div className="w-full h-full flex items-center justify-center overflow-hidden rounded-lg">
          {avatarType === 'image' && (
            <img src={avatarSource} alt="Avatar" className="w-full h-full object-cover" />
          )}
          {avatarType === 'video' && (
            <video src={avatarSource} autoPlay loop muted className="w-full h-full object-cover" />
          )}
          {avatarType === 'lipSync' && lipSyncImage && (
            <div className="relative w-full h-full">
              <img src={lipSyncImage} alt="Lip Sync Avatar" className="w-full h-full object-cover" />
              <div className="absolute bottom-0 left-0 right-0 bg-gray-900 bg-opacity-75 text-green-400 py-1 px-2 text-center">
                {lipSyncModel} Lip Sync Active
              </div>
            </div>
          )}
        </div>
        {avatarName && (
          <div className="absolute bottom-0 left-0 right-0 bg-gray-900 bg-opacity-75 text-green-400 py-1 px-2 text-center">
            {avatarName}
          </div>
        )}
        <Dialog>
          <DialogTrigger asChild>
            <Button className="absolute bottom-2 right-2 p-2 bg-gray-700 text-green-400 rounded-full hover:bg-gray-600">
              <Settings size={20} />
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-800 text-green-400">
            <DialogHeader>
              <DialogTitle>Avatar Settings</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Avatar Name</label>
                <Input
                  value={avatarName}
                  onChange={(e) => setAvatarName(e.target.value)}
                  placeholder="Enter avatar name"
                  className="bg-gray-700 text-green-400 border-green-400"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Select Avatar File (Image, GIF, or MP4)</label>
                <Input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileInput}
                  className="bg-gray-700 text-green-400 border-green-400"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Lip Sync Settings</label>
                <Select onValueChange={setLipSyncModel} defaultValue={lipSyncModel}>
                  <SelectTrigger className="w-full bg-gray-700 text-green-400 border-green-400">
                    <SelectValue placeholder="Select lip sync model" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 text-green-400">
                    <SelectItem value="MuseTalk">MuseTalk</SelectItem>
                    <SelectItem value="LivePortrait">LivePortrait</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Lip Sync Input Image</label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleLipSyncImageInput}
                  className="bg-gray-700 text-green-400 border-green-400"
                />
              </div>
              <Button 
                onClick={() => setAvatarType('lipSync')} 
                className="w-full bg-green-600 text-white hover:bg-green-700"
                disabled={!lipSyncImage}
              >
                Activate Lip Sync
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}