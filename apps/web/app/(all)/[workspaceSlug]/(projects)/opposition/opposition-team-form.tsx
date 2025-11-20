"use client";

import React, { useEffect, useState } from "react";
import PhoneInput from "react-phone-input-2";
import { Pencil, Users } from "lucide-react";
import { Button } from "@plane/propel/button";
import { Input, ModalCore, EModalPosition, Label } from "@plane/ui";
import { updateEntity } from "./(opposition-api)/update-opposition";

interface Team {
  name: string;
  address: string;
  logo: string;
  athletic_email: string;
  athletic_phone: string;
  athletic_coach_name: string;
  asst_coach_name: string;
  asst_athletic_email: string;
  asst_athletic_phone: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  team?: Team;
  index?: number;
}

const API_URL = `${process.env.NEXT_PUBLIC_CP_SERVER_URL}/meta-type`;

const convertToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
  });

async function getOppositionTeamBlock() {
  const res = await fetch(API_URL);
  const json = await res.json();

  const list = json?.["Gateway Response"]?.result;
  if (!Array.isArray(list)) return null;

  const block = list.find(
    (item: any) => Array.isArray(item) && item.some((f: any) => f?.field === "key" && f?.value === "OPPOSITIONTEAM")
  );
  if (!block) return null;

  const getField = (key: string) => {
    const found = block.find((x: any) => x?.field === key);
    return found?.value;
  };

  return {
    id: getField("id"),
    name: getField("name"),
    key: getField("key"),
    values: getField("values") || [],
  };
}

export const OppositionTeamModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [teamName, setTeamName] = useState("");
  const [address, setAddress] = useState("");
  const [athleticDirector, setAthleticDirector] = useState("");
  const [assistantDirector, setAssistantDirector] = useState("");

  const [athleticEmail, setAthleticEmail] = useState("");
  const [assistantEmail, setAssistantEmail] = useState("");

  const [athleticPhone, setAthleticPhone] = useState("");
  const [assistantPhone, setAssistantPhone] = useState("");

  const [logo, setLogo] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleImageChange = (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLogo(file);
    setPreview(URL.createObjectURL(file));
  };

  const formatPhone = (value: string, country: any) =>
    `+${country.dialCode}${value.replace(`+${country.dialCode}`, "")}`;


const handleSubmit = async () => {
   const block = await getOppositionTeamBlock();
    if (!block) {
      alert("Opposition Team meta-type missing");
      return;
    }

    let logoBase64 = "";
    if (logo) logoBase64 = await convertToBase64(logo);

  const newTeam = {
    name: teamName,
    address,
    athletic_email: athleticEmail,
    athletic_phone: athleticPhone,
    athletic_coach_name: athleticDirector,
    asst_coach_name: assistantDirector,
    asst_athletic_email: assistantEmail,
    asst_athletic_phone: assistantPhone,
    logo: logoBase64,
  };

  const updatedValues = [...block.values, newTeam];

  const entity = {
    id: block.id,
    name: block.name,
    key: block.key,
    values: updatedValues,
  };

  await updateEntity("meta-type", entity);
  onClose();
};



  return (
    <ModalCore position={EModalPosition.TOP} isOpen={isOpen}>
      <div className="px-6 py-4 border-b border-custom-border-200">
        <h2 className="text-lg font-semibold">Add Opposition Team</h2>
      </div>

      <div className="px-6 py-6 grid grid-cols-2 gap-6">
        {/* IMAGE */}
        <div className="col-span-2">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-[50px] h-[50px] border border-custom-border-200 rounded overflow-hidden flex items-center justify-center">
                {preview ? (
                  <img src={preview} alt="logo" className="w-full h-full object-cover" />
                ) : (
                  <Users className="text-zinc-500 text-3xl" />
                )}
              </div>
              <label className="absolute -top-3 -right-2 p-1 bg-zinc-600 rounded-full cursor-pointer">
                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                <Pencil className="w-4 h-4 text-zinc-300" />
              </label>
            </div>
          </div>
        </div>

        {/* FORM FIELDS */}
        <div className="col-span-2 flex flex-col gap-1">
          <Label htmlFor="teamName">Team Name</Label>
          <Input value={teamName} placeholder="Enter team name" onChange={(e) => setTeamName(e.target.value)} />
        </div>

        <div className="col-span-2 flex flex-col gap-1">
          <Label htmlFor="address">Address</Label>
          <Input value={address} placeholder="Enter team address" onChange={(e) => setAddress(e.target.value)} />
        </div>

        <div className="col-span-2 flex flex-col gap-1">
          <Label htmlFor="athleticDirector">Athletic Director</Label>
          <Input
            value={athleticDirector}
            placeholder="Enter athletic director name"
            onChange={(e) => setAthleticDirector(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="athleticEmail">Email</Label>
          <Input value={athleticEmail} placeholder="Enter email" onChange={(e) => setAthleticEmail(e.target.value)} />
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="athleticPhone">Phone</Label>
          <PhoneInput
            country="us"
            value={athleticPhone}
            onChange={(val, country) => setAthleticPhone(formatPhone(val, country))}
            inputClass="!bg-transparent border-[0.5px] !border-custom-border-200 !w-full "
            buttonClass="!bg-transparent border-[0.5px] !border-custom-border-200"
            dropdownClass="!bg-zinc-800 border-[0.5px] !border-custom-border-200"
            containerClass="w-full"
          />
        </div>

        <div className="col-span-2 flex flex-col gap-1">
          <Label htmlFor="assistantDirector">Assistant Athletic Director</Label>
          <Input
            value={assistantDirector}
            placeholder="Enter asst athlectic director name"
            onChange={(e) => setAssistantDirector(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="assistantEmail">Email</Label>
          <Input value={assistantEmail} placeholder="Enter email" onChange={(e) => setAssistantEmail(e.target.value)} />
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="assistantPhone">Phone</Label>
          <PhoneInput
            country="us"
            value={assistantPhone}
            onChange={(val, country) => setAssistantPhone(formatPhone(val, country))}
            inputClass="!bg-transparent border-[0.5px] !border-custom-border-200 !w-full "
            buttonClass="!bg-transparent border-[0.5px] !border-custom-border-200"
            dropdownClass="!bg-zinc-800 border-[0.5px] !border-custom-border-200"
            containerClass="w-full"
          />
        </div>
      </div>

      <div className="px-6 py-4 border-t border-custom-border-200 flex justify-end gap-3">
        <Button variant="neutral-primary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSubmit}>
          Save
        </Button>
      </div>
    </ModalCore>
  );
};

/* -------------------------------------------------------
   EDIT TEAM MODAL
---------------------------------------------------------*/
export const EditOppositionTeamModal: React.FC<Props> = ({ isOpen, onClose, team, index }) => {
  const [teamName, setTeamName] = useState("");
  const [address, setAddress] = useState("");
  const [athleticDirector, setAthleticDirector] = useState("");
  const [assistantDirector, setAssistantDirector] = useState("");

  const [athleticEmail, setAthleticEmail] = useState("");
  const [assistantEmail, setAssistantEmail] = useState("");

  const [athleticPhone, setAthleticPhone] = useState("");
  const [assistantPhone, setAssistantPhone] = useState("");

  const [logo, setLogo] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (team) {
      setTeamName(team.name);
      setAddress(team.address);
      setAthleticDirector(team.athletic_coach_name);
      setAthleticEmail(team.athletic_email);
      setAthleticPhone(team.athletic_phone);
      setAssistantDirector(team.asst_coach_name);
      setAssistantEmail(team.asst_athletic_email);
      setAssistantPhone(team.asst_athletic_phone);
      setPreview(team.logo || null);
    }
  }, [team]);

  const formatPhone = (value: string, country: any) =>
    `+${country.dialCode}${value.replace(`+${country.dialCode}`, "")}`;

  const handleImageChange = (e: any) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogo(file);
      setPreview(URL.createObjectURL(file));
    }
  };

 const handleUpdate = async () => {
  const block = await getOppositionTeamBlock();
  if (!block) return;

  if (index === undefined) return;

  const oldTeam = block.values[index];

  let logoBase64 = oldTeam.logo;  // default to existing logo

  if (logo instanceof File) {
    logoBase64 = await convertToBase64(logo);
  }

  const updatedTeam = {
    name: teamName,
    address,
    athletic_email: athleticEmail,
    athletic_phone: athleticPhone,
    athletic_coach_name: athleticDirector,
    asst_coach_name: assistantDirector,
    asst_athletic_email: assistantEmail,
    asst_athletic_phone: assistantPhone,
    logo: logoBase64,
  };

  const updatedValues = [...block.values];
  updatedValues[index] = updatedTeam;

  const entity = {
    id: block.id,
    name: block.name,
    key: block.key,
    values: updatedValues,
  };

  await updateEntity("meta-type", entity);
  onClose();
};



  return (
    <ModalCore position={EModalPosition.TOP} isOpen={isOpen}>
      <div className="px-6 py-4 border-b border-custom-border-200">
        <h2 className="text-lg font-semibold">Update Opposition Team</h2>
      </div>

      <div className="px-6 py-6 grid grid-cols-2 gap-6">
        {/* IMAGE */}
        <div className="col-span-2 flex items-center gap-4">
          <div className="relative">
            <div className="w-[50px] h-[50px] border border-custom-border-200 rounded overflow-hidden">
              {preview ? (
                <img src={preview} alt="logo" className="w-full h-full object-cover" />
              ) : (
                <Users className="text-zinc-500 text-3xl" />
              )}
            </div>
            <label className="absolute -top-3 -right-2 p-1 bg-zinc-600 rounded-full cursor-pointer">
              <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
              <Pencil className="w-4 h-4 text-zinc-300" />
            </label>
          </div>
        </div>

        {/* FORM */}
        <div className="col-span-2 flex flex-col gap-1">
          <Label htmlFor="teamName">Team Name</Label>
          <Input value={teamName} placeholder="Enter team name" onChange={(e) => setTeamName(e.target.value)} />
        </div>

        <div className="col-span-2 flex flex-col gap-1">
          <Label htmlFor="address">Address</Label>
          <Input value={address} placeholder="Enter team address" onChange={(e) => setAddress(e.target.value)} />
        </div>

        <div className="col-span-2 flex flex-col gap-1">
          <Label htmlFor="athlecticDirector">Athletic Director</Label>
          <Input
            value={athleticDirector}
            placeholder="Enter athletic director name"
            onChange={(e) => setAthleticDirector(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="athleticEmail">Email</Label>
          <Input
            value={athleticEmail}
            placeholder="Enter athletic director email"
            onChange={(e) => setAthleticEmail(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="athleticPhone">Phone</Label>
          <PhoneInput
            value={athleticPhone}
            country="us"
            onChange={(val, country) => setAthleticPhone(formatPhone(val, country))}
            inputClass="!bg-transparent border-[0.5px] !border-custom-border-200 !w-full "
            buttonClass="!bg-transparent border-[0.5px] !border-custom-border-200"
            dropdownClass="!bg-zinc-800 border-[0.5px] !border-custom-border-200"
            containerClass="w-full"
          />
        </div>

        <div className="col-span-2 flex flex-col gap-1">
          <Label htmlFor="assistantDirector">Assistant Athletic Director</Label>
          <Input
            value={assistantDirector}
            placeholder="Enter asst athletic director name"
            onChange={(e) => setAssistantDirector(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="assistantEmail">Email</Label>
          <Input
            value={assistantEmail}
            placeholder="Enter asst athletic director email"
            onChange={(e) => setAssistantEmail(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="assistantPhone">Phone</Label>
          <PhoneInput
            value={assistantPhone}
            country="us"
            onChange={(val, country) => setAssistantPhone(formatPhone(val, country))}
            inputClass="!bg-transparent border-[0.5px] !border-custom-border-200 !w-full "
            buttonClass="!bg-transparent border-[0.5px] !border-custom-border-200"
            dropdownClass="!bg-zinc-800 border-[0.5px] !border-custom-border-200"
            containerClass="w-full"
          />
        </div>
      </div>

      <div className="px-6 py-4 border-t border-custom-border-200 flex justify-end gap-3">
        <Button variant="neutral-primary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleUpdate}>
          Update
        </Button>
      </div>
    </ModalCore>
  );
};
