import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Send, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import type { ChatMessage } from "@shared/schema";

interface ZoningChatProps {
  analysisId: string | null;
  address: string;
  onAddressSubmit: (address: string) => void;
}

export default function ZoningChat({ analysisId, address, onAddressSubmit }: ZoningChatProps) {
  const [inputAddress, setInputAddress] = useState(address);
  const [chatInput, setChatInput] = useState("");
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading: messagesLoading } = useQuery<ChatMessage[]>({
    queryKey: ["/api/chat", analysisId],
    enabled: !!analysisId,
  });

  const analyzeZoningMutation = useMutation({
    mutationFn: async (address: string) => {
      const response = await apiRequest("/api/zoning/analyze", {
        method: "POST",
        body: { address },
      });
      return response;
    },
    onSuccess: (data) => {
      onAddressSubmit(inputAddress);
      queryClient.invalidateQueries({ queryKey: ["/api/chat"] });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest("/api/chat/send", {
        method: "POST",
        body: { 
          analysisId,
          message 
        },
      });
      return response;
    },
    onSuccess: () => {
      setChatInput("");
      queryClient.invalidateQueries({ queryKey: ["/api/chat", analysisId] });
    },
  });

  const handleAnalyze = () => {
    if (inputAddress.trim()) {
      analyzeZoningMutation.mutate(inputAddress.trim());
    }
  };

  const handleSendMessage = () => {
    if (chatInput.trim() && analysisId) {
      sendMessageMutation.mutate(chatInput.trim());
    }
  };

  return (
    <div className="px-4 py-6 bg-gradient-to-r from-primary/10 to-accent/20">
      <div className="max-w-md mx-auto">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
            <Bot className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Zoning Analyst GPT</h2>
            <p className="text-sm text-muted-foreground">AI-powered zoning analysis</p>
          </div>
        </div>
        
        {/* Address Input */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <label className="block text-sm font-medium mb-2">Property Address</label>
            <div className="flex space-x-2">
              <Input
                type="text"
                placeholder="Enter property address..."
                value={inputAddress}
                onChange={(e) => setInputAddress(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAnalyze()}
                className="flex-1"
                data-testid="input-address"
              />
              <Button 
                onClick={handleAnalyze}
                disabled={analyzeZoningMutation.isPending || !inputAddress.trim()}
                data-testid="button-analyze"
              >
                <Send className="h-4 w-4 mr-1" />
                Analyze
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* AI Chat Interface */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">AI Analysis Chat</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-64 overflow-y-auto p-4 space-y-3">
              {messagesLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div className="bg-secondary rounded-lg p-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full pulse"></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full pulse" style={{animationDelay: "0.2s"}}></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full pulse" style={{animationDelay: "0.4s"}}></div>
                    </div>
                  </div>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-muted-foreground text-sm">
                  Enter an address above to start analyzing zoning regulations
                </div>
              ) : (
                messages.map((message) => (
                  <div 
                    key={message.id} 
                    className={`flex space-x-2 ${message.role === "user" ? "justify-end" : ""}`}
                  >
                    {message.role === "assistant" && (
                      <div className="w-8 h-8 bg-primary rounded-full flex-shrink-0 flex items-center justify-center">
                        <Bot className="h-4 w-4 text-primary-foreground" />
                      </div>
                    )}
                    <div className={`${message.role === "user" ? "max-w-xs" : "flex-1"}`}>
                      <div className={`rounded-lg p-3 ${
                        message.role === "user" 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-secondary"
                      }`}>
                        <p className="text-sm">{message.content}</p>
                      </div>
                      <p className={`text-xs text-muted-foreground mt-1 ${
                        message.role === "user" ? "text-right" : ""
                      }`}>
                        {new Date(message.createdAt!).toLocaleTimeString()}
                      </p>
                    </div>
                    {message.role === "user" && (
                      <div className="w-8 h-8 bg-muted rounded-full flex-shrink-0 flex items-center justify-center">
                        <User className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                ))
              )}
              
              {/* Typing indicator when sending */}
              {sendMessageMutation.isPending && (
                <div className="flex space-x-2">
                  <div className="w-8 h-8 bg-primary rounded-full flex-shrink-0 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="bg-secondary rounded-lg p-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-muted-foreground rounded-full pulse"></div>
                        <div className="w-2 h-2 bg-muted-foreground rounded-full pulse" style={{animationDelay: "0.2s"}}></div>
                        <div className="w-2 h-2 bg-muted-foreground rounded-full pulse" style={{animationDelay: "0.4s"}}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Chat Input */}
            <div className="border-t border-border p-3">
              <div className="flex space-x-2">
                <Input
                  type="text"
                  placeholder="Ask about zoning regulations..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  disabled={!analysisId}
                  className="flex-1"
                  data-testid="input-chat"
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={!chatInput.trim() || !analysisId || sendMessageMutation.isPending}
                  data-testid="button-send-message"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
