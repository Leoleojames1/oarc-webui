import React, { useState, useEffect } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"

export default function CommandSection({ onSendMessage, selectedModel, onModelChange, isSpeechActive, onSpeechToggle }) {
  const [command, setCommand] = useState('')
  const [availableModels, setAvailableModels] = useState([])
  const [commandLibrary, setCommandLibrary] = useState([])
  const [selectedCommands, setSelectedCommands] = useState([])
  const [isEditingCommands, setIsEditingCommands] = useState(false)
  const [availableAgents, setAvailableAgents] = useState([])
  const [selectedAgent, setSelectedAgent] = useState('')
  const { toast } = useToast()

  useEffect(() => {
    fetchAvailableModels()
    fetchCommandLibrary()
    fetchAvailableAgents()
  }, [])

  const fetchAvailableModels = async () => {
    try {
      const response = await fetch('http://localhost:2020/available_models')
      const data = await response.json()
      setAvailableModels(data.models || [])
    } catch (error) {
      console.error('Error fetching available models:', error)
      toast({
        title: "Error",
        description: "Failed to fetch available models",
        variant: "destructive",
      })
    }
  }

  const fetchCommandLibrary = async () => {
    try {
      const response = await fetch('http://localhost:2020/command_library')
      const data = await response.json()
      setCommandLibrary(data.commands || [])
      setSelectedCommands(data.commands?.slice(0, 5) || [])
    } catch (error) {
      console.error('Error fetching command library:', error)
      toast({
        title: "Error",
        description: "Failed to fetch command library",
        variant: "destructive",
      })
    }
  }

  const fetchAvailableAgents = async () => {
    try {
      const response = await fetch('http://localhost:2020/available_agents')
      const data = await response.json()
      setAvailableAgents(data.agents || [])
    } catch (error) {
      console.error('Error fetching available agents:', error)
      toast({
        title: "Error",
        description: "Failed to fetch available agents",
        variant: "destructive",
      })
    }
  }

  const handleExecute = () => {
    if (command.trim()) {
      onSendMessage(command.startsWith('/') ? command : `/${command}`)
      setCommand('')
    }
  }

  const handleModelChange = (value) => {
    onModelChange(value)
    onSendMessage(`/swap ${value}`)
  }

  const handleAgentChange = (value) => {
    setSelectedAgent(value)
    onSendMessage(`/agent select ${value}`)
  }

  const toggleCommandSelection = (cmd) => {
    setSelectedCommands(prev => 
      prev.includes(cmd) ? prev.filter(c => c !== cmd) : [...prev, cmd]
    )
  }

  return (
    <Card className="w-full h-full bg-black text-green-400 font-mono">
      <CardContent className="p-4">
        <Select value={selectedModel} onValueChange={handleModelChange}>
          <SelectTrigger className="w-full mb-4 bg-black text-green-400 border-green-400">
            <SelectValue placeholder="Select Model" />
          </SelectTrigger>
          <SelectContent className="bg-black text-green-400 border-green-400">
            <SelectItem value="default">Select a model</SelectItem>
            {availableModels.map((model) => (
              <SelectItem key={model} value={model}>{model}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedAgent} onValueChange={handleAgentChange}>
          <SelectTrigger className="w-full mb-4 bg-black text-green-400 border-green-400">
            <SelectValue placeholder="Select Agent" />
          </SelectTrigger>
          <SelectContent className="bg-black text-green-400 border-green-400">
            <SelectItem value="default">Select an agent</SelectItem>
            {availableAgents.map((agent) => (
              <SelectItem key={agent.id} value={agent.id}>{agent.id}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex mb-4">
          <Input
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="Enter command or /command"
            onKeyPress={(e) => e.key === 'Enter' && handleExecute()}
            className="flex-grow bg-black text-green-400 border-green-400"
          />
          <Button onClick={handleExecute} className="ml-2 bg-green-800 text-green-400 hover:bg-green-700">Execute</Button>
        </div>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {selectedCommands.map((cmd, index) => (
            <Button
              key={index}
              onClick={() => onSendMessage(cmd)}
              className="w-full bg-green-800 text-green-400 hover:bg-green-700"
            >
              {cmd.replace('/', '')}
            </Button>
          ))}
        </div>
        <Button 
          onClick={() => setIsEditingCommands(!isEditingCommands)} 
          className="w-full mb-4 bg-green-800 text-green-400 hover:bg-green-700"
        >
          {isEditingCommands ? 'Done Editing' : 'Edit Command Buttons'}
        </Button>
        {isEditingCommands && (
          <div className="grid grid-cols-2 gap-2 mb-4">
            {commandLibrary.map((cmd, index) => (
              <div key={index} className="flex items-center">
                <Checkbox
                  id={`cmd-${index}`}
                  checked={selectedCommands.includes(cmd)}
                  onCheckedChange={() => toggleCommandSelection(cmd)}
                  className="mr-2"
                />
                <label htmlFor={`cmd-${index}`} className="text-sm">{cmd.replace('/', '')}</label>
              </div>
            ))}
          </div>
        )}
        <Button onClick={onSpeechToggle} className="w-full mt-4 bg-green-800 text-green-400 hover:bg-green-700">
          {isSpeechActive ? 'Deactivate Speech' : 'Activate Speech'}
        </Button>
      </CardContent>
    </Card>
  )
}