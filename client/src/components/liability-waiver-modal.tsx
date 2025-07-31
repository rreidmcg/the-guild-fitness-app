import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, Shield, Stethoscope } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface LiabilityWaiverModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onDecline: () => void;
  userEmail: string;
  userName: string;
}

export function LiabilityWaiverModal({ 
  isOpen, 
  onAccept, 
  onDecline, 
  userEmail, 
  userName 
}: LiabilityWaiverModalProps) {
  const [hasReadFully, setHasReadFully] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleAccept = async () => {
    if (!hasReadFully || !agreedToTerms) {
      toast({
        title: "Please Complete All Requirements",
        description: "You must read the full waiver and agree to all terms before proceeding.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Get user's IP address
      const ipAddress = await fetch('https://api.ipify.org?format=json')
        .then(res => res.json())
        .then(data => data.ip)
        .catch(() => 'unknown');

      // Submit liability waiver acceptance
      await apiRequest("/api/accept-liability-waiver", {
        method: "POST",
        body: {
          fullName: userName,
          email: userEmail,
          ipAddress,
          userAgent: navigator.userAgent,
        },
      });

      toast({
        title: "Waiver Accepted",
        description: "Thank you for completing the liability waiver. Welcome to The Guild: Gamified Fitness!",
      });

      onAccept();
    } catch (error) {
      console.error("Error accepting waiver:", error);
      toast({
        title: "Error",
        description: "Failed to submit waiver. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-4xl max-h-[85vh] p-0 flex flex-col">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center text-xl font-bold text-red-600 dark:text-red-400">
            <Shield className="w-6 h-6 mr-2" />
            LIABILITY WAIVER AND RELEASE
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Please read this document carefully before using The Guild: Gamified Fitness
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 max-h-[50vh] overflow-y-auto">
          <div className="space-y-6 text-sm">
            {/* Medical Disclaimer Section */}
            <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-start">
                <Stethoscope className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-red-800 dark:text-red-200 mb-2">
                    IMPORTANT MEDICAL DISCLAIMER
                  </h3>
                  <p className="text-red-700 dark:text-red-300 mb-3">
                    <strong>CONSULT YOUR PHYSICIAN:</strong> Before beginning any exercise program, 
                    including the use of The Guild: Gamified Fitness, you should consult with your physician 
                    or healthcare provider. This is especially important if you:
                  </p>
                  <ul className="list-disc list-inside text-red-700 dark:text-red-300 space-y-1 ml-4">
                    <li>Have any medical conditions or health concerns</li>
                    <li>Are pregnant or nursing</li>
                    <li>Are over age 35</li>
                    <li>Have a history of heart disease, high blood pressure, or other cardiovascular conditions</li>
                    <li>Have joint, muscle, or bone problems</li>
                    <li>Take medications that may affect your ability to exercise</li>
                    <li>Have not exercised regularly in the past year</li>
                  </ul>
                  <p className="text-red-700 dark:text-red-300 mt-3 font-semibold">
                    STOP IMMEDIATELY if you experience pain, discomfort, dizziness, chest pain, 
                    shortness of breath, or any other concerning symptoms during exercise. 
                    Seek immediate medical attention if needed.
                  </p>
                </div>
              </div>
            </div>

            {/* Entertainment Disclaimer */}
            <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                    ENTERTAINMENT PURPOSES ONLY
                  </h3>
                  <p className="text-yellow-700 dark:text-yellow-300">
                    The Guild: Gamified Fitness is designed for <strong>entertainment purposes only</strong>. 
                    This application is not intended to diagnose, treat, cure, or prevent any medical 
                    condition or disease. The RPG elements, character progression, and gamification 
                    features are for motivational and entertainment value only and do not constitute 
                    medical or fitness advice.
                  </p>
                </div>
              </div>
            </div>

            {/* Main Liability Waiver */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg text-foreground">ASSUMPTION OF RISK AND RELEASE OF LIABILITY</h3>
              
              <p className="text-foreground">
                By using The Guild: Gamified Fitness (the "App"), I acknowledge and agree to the following:
              </p>

              <div className="space-y-3">
                <div>
                  <h4 className="font-medium mb-1 text-foreground">1. Voluntary Participation</h4>
                  <p className="text-foreground">
                    I am voluntarily participating in fitness activities through this App. I understand 
                    that physical exercise involves inherent risks of injury, and I am participating at my own risk.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-1 text-foreground">2. Assumption of Risk</h4>
                  <p className="text-foreground">
                    I assume full responsibility for any risks, injuries, or damages, known or unknown, 
                    which I might incur as a result of participating in the fitness activities suggested 
                    by this App. This includes but is not limited to muscle strains, joint injuries, 
                    cardiovascular events, or any other injury or condition.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-1 text-foreground">3. Release of Liability</h4>
                  <p className="text-foreground">
                    I hereby release, waive, discharge, and covenant not to sue the developers, owners, 
                    and operators of The Guild: Gamified Fitness, their agents, employees, or assigns from any 
                    and all liability, claims, demands, actions, or causes of action whatsoever arising 
                    out of or related to any loss, damage, or injury that may be sustained by me while 
                    participating in activities suggested by this App.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-1 text-foreground">4. Fitness Level and Limitations</h4>
                  <p className="text-foreground">
                    I understand that it is my responsibility to know my physical limitations and to 
                    exercise within them. I will not attempt exercises or activities that are beyond 
                    my current fitness level or that cause pain or discomfort.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-1 text-foreground">5. Equipment and Environment Safety</h4>
                  <p className="text-foreground">
                    I am responsible for ensuring that any equipment I use is safe, appropriate, and 
                    in good working condition. I will exercise in a safe environment free from hazards.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-1 text-foreground">6. No Professional Advice</h4>
                  <p className="text-foreground">
                    I understand that the App does not provide professional medical, fitness, or 
                    nutritional advice. Any information provided is for general educational and 
                    entertainment purposes only.
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900 border rounded-lg p-4">
                <p className="font-medium text-center text-foreground">
                  I HAVE READ THIS WAIVER CAREFULLY AND UNDERSTAND ITS CONTENTS. 
                  I AM AWARE THAT BY USING THIS APP, I AM GIVING UP SUBSTANTIAL RIGHTS, 
                  INCLUDING MY RIGHT TO SUE FOR DAMAGES.
                </p>
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="border-t p-6 space-y-4 flex-shrink-0">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="read-fully"
                checked={hasReadFully}
                onCheckedChange={(checked) => setHasReadFully(checked as boolean)}
              />
              <label htmlFor="read-fully" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-foreground">
                I have read and understand the entire liability waiver above
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="agree-terms"
                checked={agreedToTerms}
                onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
              />
              <label htmlFor="agree-terms" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-foreground">
                I agree to all terms and conditions in this liability waiver and release
              </label>
            </div>
          </div>

          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={onDecline}
              className="flex-1 border-2 border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-950 font-semibold"
              disabled={isSubmitting}
            >
              Decline & Exit
            </Button>
            
            <Button
              onClick={handleAccept}
              disabled={!hasReadFully || !agreedToTerms || isSubmitting}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold border-2 border-green-600 disabled:opacity-50"
            >
              {isSubmitting ? "Processing..." : "Accept & Continue"}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            By clicking "Accept & Continue", you electronically sign this waiver and a copy will be sent to your email.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}