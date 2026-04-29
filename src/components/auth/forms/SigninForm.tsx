"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";

import { Input, Button, Link as HeroLink } from "@heroui/react";

import { SignInSchema, signInSchema_ } from "@/lib/formValidationSchemas";
import { verifyCredentials } from "@/lib/actions/actionAuths";

const SigninForm = () => {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const toggleVisibility = () => setIsVisible(!isVisible);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInSchema>({
    resolver: zodResolver(signInSchema_),
    defaultValues: {
      username: "",
      passwordHash: "",
    },
  });

  const onSubmit = async (values: SignInSchema) => {
    const finalData = { ...values };
    setIsSubmitting(true);
    try {
      const result = await verifyCredentials(finalData);

      if (result.message === "Invalid credentials") {
        toast.error("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
        setIsSubmitting(false);
      } else {    
        window.location.replace("/dashboard");
        setIsSubmitting(false);
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
        return;
      }
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="w-full flex flex-col gap-4"
    >
      <Input
        type="text"
        label="Username"
        labelPlacement="outside"
        placeholder="name@example.com"
        radius="full"
        variant="bordered"
        isInvalid={!!errors.username}
        errorMessage={errors.username?.message}
        {...register("username")}
        classNames={{
          label: "text-sm font-medium text-black dark:text-zinc-200 ml-1",
          inputWrapper:
            "border-zinc-200 dark:border-zinc-800 hover:border-black dark:hover:border-zinc-400 focus-within:!border-black dark:focus-within:!border-zinc-400 bg-transparent h-12",
          input: "text-sm",
        }}
      />

      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between items-center ml-1">
          <label className="text-sm font-medium text-black dark:text-zinc-200">
            Password
          </label>
          <HeroLink
            as={Link}
            href="#"
            className="text-xs text-zinc-500 hover:text-black dark:hover:text-zinc-300 cursor-pointer"
          >
            Forgot?
          </HeroLink>
        </div>

        <Input
          type={isVisible ? "text" : "password"}
          placeholder="••••••••"
          radius="full"
          variant="bordered"
          isInvalid={!!errors.passwordHash}
          errorMessage={errors.passwordHash?.message}
          {...register("passwordHash")}
          classNames={{
            inputWrapper:
              "border-zinc-200 dark:border-zinc-800 hover:border-black dark:hover:border-zinc-400 focus-within:!border-black dark:focus-within:!border-zinc-400 bg-transparent h-12",
            input: "text-sm",
          }}
          endContent={
            <button
              className="focus:outline-none"
              type="button"
              onClick={toggleVisibility}
            >
              {isVisible ? (
                <EyeOff className="text-2xl text-default-400 pointer-events-none" />
              ) : (
                <Eye className="text-2xl text-default-400 pointer-events-none" />
              )}
            </button>
          }
        />
      </div>

      <Button
        type="submit"
        radius="full"
        isLoading={isSubmitting}
        className="mt-2 w-full bg-black text-white font-medium hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 h-12 text-sm"
      >
        {isSubmitting ? "กำลังตรวจสอบ..." : "เข้าสู่ระบบ"}
      </Button>
    </form>
  );
};

export default SigninForm;
