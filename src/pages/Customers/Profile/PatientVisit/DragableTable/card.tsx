import type { Identifier, XYCoord } from "dnd-core";
import { FC, ReactNode, useCallback } from "react";
import { useRef } from "react";
import { useDrag, useDrop } from "react-dnd";
import {
  Get,
  Create,
  Modify,
} from "~/repositories/patVisitClaimDiagnosis.servise";

const ItemTypes = {
  CARD: "card",
};

const style = {
  border: "1px dashed gray",
  backgroundColor: "white",
  cursor: "move",
};

export interface CardProps {
  id: any;
  children: ReactNode;
  index: number;
  moveCard: (dragIndex: number, hoverIndex: number) => void;
  onFetch: (pagination: any) => void;
}

interface DragItem {
  index: number;
  id: string;
  sortorder: number;
  icdcodeid: number;
  patvisitid: number;
  description: string;
}

export const Card: FC<CardProps> = ({
  id,
  children,
  index,
  moveCard,
  onFetch,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  const handleUpdateOrder = useCallback(async (id: any, hoverIndex: number) => {
    await Get(id).then(
      async response => {
        await Modify(response.data[0].id, {
          ...response.data[0],
          sortorder: hoverIndex + 1,
        }).then(
          async () => {
            console.log("done");
          },
          (error: any) => {
            console.log("error", error);
          }
        );
      },
      (error: any) => {
        console.log("error", error);
      }
    );
  }, []);

  const [{ handlerId }, drop] = useDrop<
    DragItem,
    void,
    { handlerId: Identifier | null }
  >({
    accept: ItemTypes.CARD,
    collect(monitor: any) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    hover(item: DragItem, monitor: any) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;

      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return;
      }

      // Determine rectangle on screen
      const hoverBoundingRect = ref.current?.getBoundingClientRect();

      // Get vertical middle
      const hoverMiddleY =
        (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

      // Determine mouse position
      const clientOffset = monitor.getClientOffset();

      // Get pixels to the top
      const hoverClientY = (clientOffset as XYCoord).y - hoverBoundingRect.top;

      // Only perform the move when the mouse has crossed half of the items height
      // When dragging downwards, only move when the cursor is below 50%
      // When dragging upwards, only move when the cursor is above 50%

      // Dragging downwards
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }

      // Dragging upwards
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }

      // Time to actually perform the action
      moveCard(dragIndex, hoverIndex);

      // handleUpdateOrder(id, dragIndex);
      // handleUpdateOrder(item.id, hoverIndex);
      // onFetch({
      //   page: 0,
      //   limit: 50,
      // });

      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.CARD,
    item: () => {
      return { id, index };
    },
    collect: (monitor: any) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const opacity = isDragging ? 0 : 1;
  drag(drop(ref));
  return (
    <div ref={ref} style={{ ...style, opacity }} data-handler-id={handlerId}>
      {children}
    </div>
  );
};
