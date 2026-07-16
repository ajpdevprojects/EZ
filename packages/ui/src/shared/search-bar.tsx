import { Search } from "lucide-react";
import * as React from "react";
import { Input, type InputProps } from "../primitives/input";

export type SearchBarProps = Omit<InputProps, "leadingIcon" | "type">;

export const SearchBar = React.forwardRef<HTMLInputElement, SearchBarProps>(
  ({ placeholder = "Search jobs, companies…", ...props }, ref) => (
    <Input
      ref={ref}
      type="search"
      placeholder={placeholder}
      leadingIcon={<Search className="size-4" aria-hidden="true" />}
      {...props}
    />
  ),
);
SearchBar.displayName = "SearchBar";
