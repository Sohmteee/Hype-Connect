"use client";

import React, { useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/firebase";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { createEventAction } from "@/app/dashboard/actions";

interface CreateEventDialogProps {
  onEventCreated: (event: any) => void;
}

export function CreateEventDialog({ onEventCreated }: CreateEventDialogProps) {
  const [user] = useAuthState(auth);
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    imageUrl: "",
    startDateTime: "",
    endDateTime: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // For now, store as data URL (in production, upload to Cloud Storage)
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
        setFormData((prev) => ({
          ...prev,
          imageUrl: result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in",
        variant: "destructive",
      });
      return;
    }

    if (!formData.name || !formData.location) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (!formData.startDateTime) {
      toast({
        title: "Error",
        description: "Please select a start date/time",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Convert datetime-local to ISO string
      const startDateTime = formData.startDateTime
        ? new Date(formData.startDateTime).toISOString()
        : "";
      const endDateTime = formData.endDateTime
        ? new Date(formData.endDateTime).toISOString()
        : "";

      const submitData = {
        ...formData,
        startDateTime,
        endDateTime,
      };

      const response = await createEventAction(user.uid, submitData);

      if (response.success) {
        onEventCreated(response.data);
        setFormData({ name: "", location: "", imageUrl: "", startDateTime: "", endDateTime: "" });
        setImagePreview(null);
        setOpen(false);
        toast({
          title: "Success",
          description: "Event created successfully!",
        });
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to create event",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Create event error:", error);
      toast({
        title: "Error",
        description: "Failed to create event",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button onClick={() => setOpen(true)} className="glowing-accent-btn">
        <Plus className="mr-2 h-4 w-4" />
        New Event
      </Button>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Event</DialogTitle>
          <DialogDescription>
            Create a new event to start receiving hype messages
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Event Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="e.g., Friday Night Vibes"
              value={formData.name}
              onChange={handleInputChange}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              name="location"
              placeholder="e.g., Downtown Club"
              value={formData.location}
              onChange={handleInputChange}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">Event Image (Optional)</Label>
            <Input
              id="image"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              disabled={isLoading}
            />
            {imagePreview && (
              <div className="mt-2 relative w-full h-32 rounded-lg overflow-hidden border border-border">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="startDateTime">Event Start Date & Time</Label>
            <Input
              id="startDateTime"
              name="startDateTime"
              type="datetime-local"
              value={formData.startDateTime}
              onChange={handleInputChange}
              disabled={isLoading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="endDateTime">Event End Date & Time (Optional)</Label>
            <Input
              id="endDateTime"
              name="endDateTime"
              type="datetime-local"
              value={formData.endDateTime}
              onChange={handleInputChange}
              disabled={isLoading}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
                setImagePreview(null);
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="glowing-accent-btn">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Event"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
